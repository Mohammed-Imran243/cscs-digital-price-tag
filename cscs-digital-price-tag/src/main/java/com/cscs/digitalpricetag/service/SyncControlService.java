package com.cscs.digitalpricetag.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Map;

/**
 * SyncControlService
 *
 * Responsible for communicating with TL's cscs-esl-connect-app-sync service.
 * Calls start, stop, and status endpoints on TL's backend.
 *
 * Called by: SyncControlController (this project)
 * Calls:     http://{sync.service.url}/admin/sync/{start|stop|status}
 *
 * Uses a dedicated WebClient (not the DragonESL one) to avoid interference
 * with existing Dragon ESL auth flows.
 */
@Service
public class SyncControlService {

    private static final Logger logger = LoggerFactory.getLogger(SyncControlService.class);

    @Value("${sync.service.url}")
    private String syncServiceUrl;

    @Value("${sync.service.secret:}")
    private String syncServiceSecret;

    // Dedicated WebClient for sync service calls.
    // Created inline — no interference with dragonEslWebClient or dragonEslAuthWebClient beans.
    private WebClient buildSyncClient() {
        WebClient.Builder builder = WebClient.builder()
                .baseUrl(syncServiceUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        if (syncServiceSecret != null && !syncServiceSecret.isEmpty()) {
            builder.defaultHeader("X-Internal-Secret", syncServiceSecret);
        }
        return builder.build();
    }

    /**
     * Calls POST /admin/sync/start on TL's sync backend.
     * Returns the response map: { success, running, message }
     */
    public Map<String, Object> startSync() {
        logger.info("Requesting SYNC START from sync service at {}", syncServiceUrl);
        try {
            Map<String, Object> response = buildSyncClient()
                    .post()
                    .uri("/admin/sync/start")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return response != null ? response : Map.of("success", true, "running", true, "message", "Sync start request succeeded");
        } catch (WebClientResponseException e) {
            logger.error("Sync START failed — HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return Map.of("success", false, "running", false,
                    "message", "Sync service returned error: " + e.getStatusCode());
        } catch (Exception e) {
            logger.error("Sync START failed — Could not reach sync service: {}", e.getMessage());
            return Map.of("success", false, "running", false,
                    "message", "Could not reach sync service. Is it running?");
        }
    }

    /**
     * Calls POST /admin/sync/stop on TL's sync backend.
     * Returns the response map: { success, running, message }
     */
    public Map<String, Object> stopSync() {
        logger.info("Requesting SYNC STOP from sync service at {}", syncServiceUrl);
        try {
            Map<String, Object> response = buildSyncClient()
                    .post()
                    .uri("/admin/sync/stop")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return response != null ? response : Map.of("success", true, "running", false, "message", "Sync stop request succeeded");
        } catch (WebClientResponseException e) {
            logger.error("Sync STOP failed — HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return Map.of("success", false, "running", true,
                    "message", "Sync service returned error: " + e.getStatusCode());
        } catch (Exception e) {
            logger.error("Sync STOP failed — Could not reach sync service: {}", e.getMessage());
            return Map.of("success", false, "running", true,
                    "message", "Could not reach sync service. Is it running?");
        }
    }

    /**
     * Calls GET /admin/sync/status on TL's sync backend.
     * Returns the response map: { success, running, message }
     */
    public Map<String, Object> getSyncStatus() {
        logger.debug("Checking sync status from sync service at {}", syncServiceUrl);
        try {
            Map<String, Object> response = buildSyncClient()
                    .get()
                    .uri("/admin/sync/status")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return response != null ? response : Map.of("success", true, "running", false, "message", "Sync status check succeeded");
        } catch (WebClientResponseException e) {
            logger.error("Sync STATUS check failed — HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return Map.of("success", false, "running", false,
                    "message", "Could not check sync status: " + e.getStatusCode());
        } catch (Exception e) {
            logger.error("Sync STATUS check failed — Could not reach sync service: {}", e.getMessage());
            return Map.of("success", false, "running", false,
                    "message", "Could not reach sync service. Is it running?");
        }
    }
}