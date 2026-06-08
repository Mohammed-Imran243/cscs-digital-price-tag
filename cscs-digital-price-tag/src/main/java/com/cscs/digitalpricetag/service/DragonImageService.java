package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.exception.DragonImageFetchException;
import com.cscs.digitalpricetag.exception.DragonImageNotFoundException;
import com.cscs.digitalpricetag.exception.DragonImageValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Base64;
import java.util.regex.Pattern;

@Service
public class DragonImageService {

    private static final Logger log = LoggerFactory.getLogger(DragonImageService.class);

    // Matches paths like group1/M00/.../image.png, rejects full URLs, schemes, and path traversal
    private static final Pattern VALID_PATH_PATTERN = Pattern.compile("^/?[a-zA-Z0-9/_-]+\\.(?i)(png|jpg|jpeg|gif|bmp)$");

    private final DragonEslApiClient dragonEslApiClient;
    private final CacheManager cacheManager;

    public DragonImageService(DragonEslApiClient dragonEslApiClient, CacheManager cacheManager) {
        this.dragonEslApiClient = dragonEslApiClient;
        this.cacheManager = cacheManager;
    }

    public String getBase64Image(String path) {
        // Validation
        if (!StringUtils.hasText(path)) {
            log.warn("Invalid path attempt: empty path");
            throw new DragonImageValidationException("Image path cannot be empty.");
        }

        if (path.contains("..") || path.contains("://") || path.startsWith("//")) {
            log.warn("Invalid path attempt: path traversal or full URL detected - {}", path);
            throw new DragonImageValidationException("Invalid image path format.");
        }

        if (!VALID_PATH_PATTERN.matcher(path).matches()) {
            log.warn("Invalid path attempt: fails regex validation - {}", path);
            throw new DragonImageValidationException("Invalid image path or unsupported extension. Allowed: png, jpg, jpeg, gif, bmp.");
        }

        // Manual Cache Check for explicit logging
        Cache cache = cacheManager.getCache("dragonImages");
        if (cache != null) {
            Cache.ValueWrapper valueWrapper = cache.get(path);
            if (valueWrapper != null) {
                log.info("Cache hit for image: {}", path);
                return (String) valueWrapper.get();
            }
        }

        log.info("Cache miss, fetching image from DragonESL: {}", path);
        try {
            // Ensure path starts with a slash
            String normalizedPath = path.startsWith("/") ? path : "/" + path;
            byte[] imageBytes = dragonEslApiClient.download(normalizedPath);
            
            if (imageBytes != null && imageBytes.length > 0) {
                String mimeType = "image/png";
                String lowerPath = path.toLowerCase();
                if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) {
                    mimeType = "image/jpeg";
                } else if (lowerPath.endsWith(".gif")) {
                    mimeType = "image/gif";
                } else if (lowerPath.endsWith(".bmp")) {
                    mimeType = "image/bmp";
                }
                
                String base64 = Base64.getEncoder().encodeToString(imageBytes);
                String result = "data:" + mimeType + ";base64," + base64;
                
                if (cache != null) {
                    cache.put(path, result);
                }
                
                return result;
            } else {
                log.warn("DragonESL API returned empty image for path: {}", path);
                throw new DragonImageNotFoundException("Image not found on DragonESL server for path: " + path);
            }
        } catch (DragonImageNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch image from DragonESL API for path: {}", path, e);
            throw new DragonImageFetchException("Failed to fetch image from DragonESL API.", e);
        }
    }
}
