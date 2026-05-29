package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.exception.DragonEslException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class IconService {

    private static final Logger log = LoggerFactory.getLogger(IconService.class);
    private final DragonEslApiClient dragonEslApiClient;

    public IconService(DragonEslApiClient dragonEslApiClient) {
        this.dragonEslApiClient = dragonEslApiClient;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> findIconsInTemplate(String templateId) {
        try {
            String url = "/zk/icon/findInTemp/" + templateId.trim();
            log.info("Fetching template details from ZKong: {}", url);

            Map<?, ?> response = dragonEslApiClient.get(url, Map.class);

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for findInTemp", HttpStatus.BAD_GATEWAY);
            }

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to fetch template icons: " + msg, HttpStatus.BAD_REQUEST);
            }

            Object dataObj = response.get("data");
            if (dataObj instanceof List) {
                return (List<Map<String, Object>>) dataObj;
            } else if (dataObj instanceof Map) {
                Map<String, Object> dataMap = (Map<String, Object>) dataObj;
                if (dataMap.get("list") instanceof List) {
                    return (List<Map<String, Object>>) dataMap.get("list");
                } else if (dataMap.get("rows") instanceof List) {
                    return (List<Map<String, Object>>) dataMap.get("rows");
                } else if (dataMap.get("content") instanceof List) {
                    return (List<Map<String, Object>>) dataMap.get("content");
                }
            }

            return Collections.emptyList();
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching icons for template {}: {}", templateId, e.getMessage(), e);
            throw new DragonEslException(extractErrorDetails(e), HttpStatus.BAD_REQUEST);
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> addIconToTemplate(String templateId, Map<String, Object> iconData) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("templateId", templateId);
            payload.put("iconId", iconData.get("iconId"));
            payload.put("x", iconData.getOrDefault("x", 20));
            payload.put("y", iconData.getOrDefault("y", 20));
            payload.put("width", iconData.getOrDefault("width", 50));
            payload.put("height", iconData.getOrDefault("height", 50));

            if (iconData.containsKey("parseAlgorithm")) {
                payload.put("parseAlgorithm", iconData.get("parseAlgorithm"));
            }
            if (iconData.containsKey("describeName")) {
                payload.put("describeName", iconData.get("describeName"));
            }
            if (iconData.containsKey("type")) {
                payload.put("type", iconData.get("type"));
            }
            if (iconData.containsKey("text")) {
                payload.put("text", iconData.get("text"));
            }
            if (iconData.containsKey("color")) {
                payload.put("color", iconData.get("color"));
            }
            if (iconData.containsKey("fontSize")) {
                payload.put("fontSize", iconData.get("fontSize"));
            }

            log.info("Adding icon to template {} with payload: {}", templateId, payload);

            Map<?, ?> response = dragonEslApiClient.post("/zk/icon/addToTemp", payload, Map.class);

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for addToTemp", HttpStatus.BAD_GATEWAY);
            }

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to add icon to template: " + msg, HttpStatus.BAD_REQUEST);
            }

            Object dataObj = response.get("data");
            if (dataObj instanceof Map) {
                return (Map<String, Object>) dataObj;
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Icon added successfully");
            return result;

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error adding icon to template {}: {}", templateId, e.getMessage(), e);
            throw new DragonEslException(extractErrorDetails(e), HttpStatus.BAD_REQUEST);
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> removeIconFromTemplate(String templateId, String iconId) {
        try {
            String url = "/zk/icon/removeFromTemp/" + templateId.trim() + "/" + iconId.trim();
            log.info("Removing icon {} from template {}", iconId, templateId);

            Map<?, ?> response = dragonEslApiClient.delete(url, Map.class);

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for removeFromTemp", HttpStatus.BAD_GATEWAY);
            }

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to remove icon from template: " + msg, HttpStatus.BAD_REQUEST);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Icon removed successfully");
            return result;

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error removing icon {} from template {}: {}", iconId, templateId, e.getMessage(), e);
            throw new DragonEslException(extractErrorDetails(e), HttpStatus.BAD_REQUEST);
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> updateIconInTemplate(String templateId, String iconId, Map<String, Object> updateData) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("templateId", templateId);
            payload.put("iconId", iconId);
            payload.put("x", updateData.getOrDefault("x", updateData.get("left")));
            payload.put("y", updateData.getOrDefault("y", updateData.get("top")));
            payload.put("width", updateData.get("width"));
            payload.put("height", updateData.get("height"));

            log.info("Updating icon {} in template {} with payload: {}", iconId, templateId, payload);

            Map<?, ?> response = dragonEslApiClient.put("/zk/icon/updateInTemp", payload, Map.class);

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for updateInTemp", HttpStatus.BAD_GATEWAY);
            }

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to update icon in template: " + msg, HttpStatus.BAD_REQUEST);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Icon updated successfully");
            return result;

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating icon {} in template {}: {}", iconId, templateId, e.getMessage(), e);
            throw new DragonEslException(extractErrorDetails(e), HttpStatus.BAD_REQUEST);
        }
    }

    private String extractErrorDetails(Exception e) {
        try {
            java.lang.reflect.Method method = e.getClass().getMethod("getResponseBodyAsString");
            String body = (String) method.invoke(e);
            if (body != null && !body.isEmpty()) {
                if (body.contains("\"message\"")) {
                    java.util.regex.Matcher m = java.util.regex.Pattern.compile("\"message\"\\s*:\\s*\"([^\"]+)\"").matcher(body);
                    if (m.find()) {
                        return m.group(1);
                    }
                }
                return body;
            }
        } catch (Exception ignored) {}
        return e.getMessage();
    }
}