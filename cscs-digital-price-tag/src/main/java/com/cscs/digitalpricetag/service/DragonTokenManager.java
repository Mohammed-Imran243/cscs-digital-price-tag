package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.config.DragonEslProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * Enterprise Token Lifecycle Manager for Dragon ESL.
 *
 * This singleton service maintains a thread-safe, in-memory cache of the Dragon ESL session token.
 * It proactively refreshes the token in the background every 3 minutes to avoid expiration during requests.
 * It also supports synchronous on-demand refresh for recovering from mid-session invalidations.
 */
@Service
public class DragonTokenManager {

    private static final Logger log = LoggerFactory.getLogger(DragonTokenManager.class);

    private final DragonAuthService authService;
    private final DragonEslProperties properties;

    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final ReentrantReadWriteLock.ReadLock readLock = lock.readLock();
    private final ReentrantReadWriteLock.WriteLock writeLock = lock.writeLock();

    private String currentToken;

    public DragonTokenManager(DragonAuthService authService, DragonEslProperties properties) {
        this.authService = authService;
        this.properties = properties;
    }

    /**
     * Eagerly fetch token on application startup.
     */
    @PostConstruct
    public void init() {
        log.info("Initializing DragonTokenManager...");
        try {
            forceRefresh();
        } catch (Exception e) {
            log.warn("Initial Dragon ESL token fetch failed (this is expected if the external API is offline): {}", e.getMessage());
            // We don't rethrow here to allow the application to start for development/testing
        }
    }

    /**
     * Scheduled background refresh every 30 minutes (1,800,000 ms) with an initial delay of 30 minutes.
     * This avoids aggressive logins and startup race conditions.
     */
    @Scheduled(fixedRate = 1800000, initialDelay = 1800000)
    public void scheduledTokenRefresh() {
        log.debug("Triggering scheduled background refresh for Dragon ESL token...");
        try {
            String token = authService.login(properties.getUsername(), properties.getPassword());
            setToken(token);
        } catch (Exception e) {
            log.error("Scheduled background token refresh failed: {}", e.getMessage());
        }
    }

    /**
     * Get the system's Dragon ESL username.
     */
    public String getUsername() {
        return properties.getUsername();
    }

    /**
     * Synchronously force a token refresh.
     * Used mainly for immediate recovery when the API returns an auth/expiration error.
     */
    public void forceRefresh() {
        doRefresh();
    }

    private void doRefresh() {
        writeLock.lock();
        try {
            log.info("Synchronously forcing Dragon ESL token refresh...");
            String token = authService.login(properties.getUsername(), properties.getPassword());
            this.currentToken = token;
            log.info("Dragon ESL token successfully refreshed and cached.");
        } catch (Exception e) {
            log.error("Failed to synchronously refresh Dragon ESL token: {}", e.getMessage());
            throw e;
        } finally {
            writeLock.unlock();
        }
    }

    /**
     * Get the currently valid token. If missing, forces a refresh.
     */
    public String getValidToken() {
        readLock.lock();
        try {
            if (currentToken != null) {
                return currentToken;
            }
        } finally {
            readLock.unlock();
        }

        // Token is null, force refresh (this handles cold-start race conditions)
        log.warn("Token cache is empty, forcing immediate refresh.");
        forceRefresh();

        readLock.lock();
        try {
            return currentToken;
        } finally {
            readLock.unlock();
        }
    }

    public void setToken(String token) {
        writeLock.lock();
        try {
            this.currentToken = token;
            log.debug("Dragon ESL token updated in cache.");
        } finally {
            writeLock.unlock();
        }
    }
}
