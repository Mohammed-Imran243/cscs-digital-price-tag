package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.dto.dragon.DragonTemplateGenericResponse;
import com.cscs.digitalpricetag.dto.dragon.DragonTemplateListResponse;
import com.cscs.digitalpricetag.exception.DragonEslException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.Collections;
import java.util.stream.Collectors;

@Service
public class TemplateService {

    private static final Logger log = LoggerFactory.getLogger(TemplateService.class);
    private final DragonEslApiClient dragonEslApiClient;

    public TemplateService(DragonEslApiClient dragonEslApiClient) {
        this.dragonEslApiClient = dragonEslApiClient;
    }

    public List<String> getCategories() {
        try {
            Map<?, ?> response = dragonEslApiClient.get("/zk/attrCategory/findList", Map.class);
            if (response != null) {
                Object dataObj = response.get("data");
                if (dataObj instanceof List) {
                    List<?> list = (List<?>) dataObj;
                    return list.stream()
                            .filter(item -> item instanceof Map)
                            .map(item -> (Map<?, ?>) item)
                            .map(item -> item.get("categoryName"))
                            .filter(name -> name != null && !name.toString().isBlank())
                            .map(Object::toString)
                            .distinct()
                            .sorted()
                            .collect(Collectors.toList());
                }
            }
        } catch (Exception e) {
            log.error("Error fetching template categories: {}", e.getMessage());
        }
        return Collections.emptyList();
    }

    public Object addCategory(Map<String, Object> request) {
        return performPost("/zk/attrCategory/add", request);
    }

    public Object getModels() {
        return performGet("/zk/pricetagModel/getAll");
    }

    public DragonTemplateListResponse getTemplates(int page, int size, Map<String, Object> searchParams) {
        try {
            int dragonPage = page; // Zkong template list is 0-based

            if (searchParams != null && searchParams.containsKey("storeId")) {
                Object storeIdObj = searchParams.get("storeId");
                if (storeIdObj instanceof String && !((String) storeIdObj).toString().isBlank()) {
                    try {
                        long storeIdLong = Long.parseLong(storeIdObj.toString().trim());
                        searchParams.put("storeId", storeIdLong);
                    } catch (NumberFormatException e) {
                        log.warn("Could not parse storeId string to long: {}", storeIdObj);
                    }
                }
            }

            if (searchParams != null && searchParams.containsKey("sceneNumber")) {
                Object sceneObj = searchParams.get("sceneNumber");
                if (sceneObj != null && !sceneObj.toString().isBlank()) {
                    try {
                        int sceneInt = Integer.parseInt(sceneObj.toString().trim());
                        searchParams.put("sceneNumber", sceneInt);
                    } catch (NumberFormatException e) {
                        log.warn("Could not parse sceneNumber string to int: {}", sceneObj);
                    }
                }
            }

            DragonTemplateListResponse response = dragonEslApiClient.post(
                    "/zk/template/list/" + dragonPage + "/" + size,
                    searchParams != null ? searchParams : new HashMap<>(),
                    DragonTemplateListResponse.class
            );

            if (response == null || !response.isSuccess()) {
                String msg = response != null ? response.getMessage() : "No response";
                throw new DragonEslException("Failed to fetch templates: " + msg, HttpStatus.BAD_GATEWAY);
            }

            return response;
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching templates: {}", e.getMessage());
            throw new DragonEslException("Template fetch failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    public Object getTemplateBaseById(String id) {
        return performGet("/zk/template/getTemplateBaseById/" + id);
    }

    public List<String> getTemplateTypes() {
        try {
            Map<?, ?> response = dragonEslApiClient.get("/zk/templateAttr/findList", Map.class);
            if (response != null) {
                Object dataObj = response.get("data");
                if (dataObj instanceof List) {
                    List<?> list = (List<?>) dataObj;
                    return list.stream()
                            .filter(item -> item instanceof Map)
                            .map(item -> (Map<?, ?>) item)
                            .filter(item -> {
                                Object flagObj = item.get("flag");
                                if (flagObj == null) return false;
                                String flagStr = flagObj.toString().trim();
                                return "1".equals(flagStr) || "1.0".equals(flagStr);
                            })
                            .map(item -> item.get("attrName"))
                            .filter(name -> name != null && !name.toString().isBlank())
                            .map(Object::toString)
                            .distinct()
                            .sorted()
                            .collect(Collectors.toList());
                }
            }
        } catch (Exception e) {
            log.error("Error fetching template types: {}", e.getMessage());
        }
        return Collections.emptyList();
    }

    public Object checkTemplateName(String storeId, String templateName) {
        return performGet("/zk/template/checkTempName/" + storeId + "?templateName=" + templateName);
    }

    public Object addTemplate(Map<String, Object> request) {
        if (request != null) {
            if (request.containsKey("storeId")) {
                Object storeIdObj = request.get("storeId");
                if (storeIdObj instanceof String && !((String) storeIdObj).isBlank()) {
                    try {
                        request.put("storeId", Long.parseLong(storeIdObj.toString().trim()));
                    } catch (NumberFormatException e) {
                        log.warn("Could not parse storeId string to long: {}", storeIdObj);
                    }
                }
            }
        }

        // Dragon ESL expects { templateBase: {}, templateElements: [], templateElementAdvancedAttributes: [] }
        Map<String, Object> payload = new HashMap<>();
        
        // Extract elements if present
        Object items = request.get("items");
        if (items == null) {
            items = new java.util.ArrayList<>();
        }
        
        // Clean up the base request to only contain base fields
        request.remove("items");
        request.remove("type");

        payload.put("templateBase", request);
        // We will send empty arrays for now until we fully reverse-engineer the element attributes
        payload.put("templateElements", new java.util.ArrayList<>());
        payload.put("templateElementAdvancedAttributes", new java.util.ArrayList<>());

        return performPost("/zk/template/addTemplateAllRefactor", payload);
    }

    public Object updateTemplateBase(String id, Map<String, Object> request) {
        return performPut("/zk/template/updateBase/" + id, request);
    }

    public Object enableTemplate(String id, String status) {
        if ("0".equals(status)) {
            return performGet("/zk/template/disable/" + id + "/1");
        } else {
            return performGet("/zk/template/enable/" + id + "/1");
        }
    }

    public Object deleteTemplate(String id, String storeId, boolean isCompel) {
        Map<String, Object> body = new HashMap<>();
        String compelFlag = isCompel ? "1" : "0";
        return performPut("/zk/template/delete/" + id + "/" + compelFlag, body);
    }

    /**
     * Fetch store icons list from Dragon ESL.
     * Uses POST /zk/storeIcon/list matching DragonESL Store Icon tab.
     */
    public Object getStoreIcons(int page, int size, Map<String, Object> params) {
        try {
            Map<String, Object> body = new HashMap<>();
            if (params != null) {
                body.putAll(params);
            }

            Map<?, ?> response = dragonEslApiClient.post(
                    "/zk/storeIcon/list/" + page + "/" + size,
                    body,
                    Map.class
            );

            if (response == null) {
                log.warn("getStoreIcons: null response from Dragon ESL");
                return Collections.emptyMap();
            }

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (
                Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj)
            );

            if (!success && !codeOk) {
                String msg = response.get("message") != null
                    ? response.get("message").toString()
                    : "Unknown error";
                log.warn("getStoreIcons failed: {}", msg);
                return Collections.emptyMap();
            }

            return response.get("data") != null ? response.get("data") : Collections.emptyMap();

        } catch (Exception e) {
            log.error("Error fetching store icons: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    private Object performGet(String url) {
        try {
            DragonTemplateGenericResponse response = dragonEslApiClient.get(
                    url,
                    DragonTemplateGenericResponse.class
            );
            if (response == null || !response.isSuccess()) {
                String msg = response != null ? response.getMessage() : "No response";
                throw new DragonEslException("GET failed: " + msg, HttpStatus.BAD_GATEWAY);
            }
            return response.getData() != null ? response.getData() : response;
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error on GET {}: {}", url, e.getMessage());
            throw new DragonEslException("GET request failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    private Object performPost(String url, Map<String, Object> request) {
        try {
            DragonTemplateGenericResponse response = dragonEslApiClient.post(
                    url,
                    request != null ? request : new HashMap<>(),
                    DragonTemplateGenericResponse.class
            );
            if (response == null || !response.isSuccess()) {
                String msg = response != null ? response.getMessage() : "No response";
                throw new DragonEslException("POST failed: " + msg, HttpStatus.BAD_GATEWAY);
            }
            return response.getData() != null ? response.getData() : response;
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error on POST {}: {}", url, e.getMessage());
            throw new DragonEslException("POST request failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    private Object performPut(String url, Map<String, Object> request) {
        try {
            DragonTemplateGenericResponse response = dragonEslApiClient.put(
                    url,
                    request != null ? request : new HashMap<>(),
                    DragonTemplateGenericResponse.class
            );
            if (response == null || !response.isSuccess()) {
                String msg = response != null ? response.getMessage() : "No response";
                throw new DragonEslException("PUT failed: " + msg, HttpStatus.BAD_GATEWAY);
            }
            return response.getData() != null ? response.getData() : response;
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error on PUT {}: {}", url, e.getMessage());
            throw new DragonEslException("PUT request failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }
}

