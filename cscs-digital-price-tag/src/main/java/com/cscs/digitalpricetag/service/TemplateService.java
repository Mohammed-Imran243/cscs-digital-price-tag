package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.dto.DragonTemplateGenericResponse;
import com.cscs.digitalpricetag.dto.DragonTemplateListResponse;
import com.cscs.digitalpricetag.exception.DragonEslException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class TemplateService {

    private static final Logger log = LoggerFactory.getLogger(TemplateService.class);
    private final DragonEslApiClient dragonEslApiClient;

    public TemplateService(DragonEslApiClient dragonEslApiClient) {
        this.dragonEslApiClient = dragonEslApiClient;
    }

    public Object getCategories() {
        return performGet("/zk/templateAttr/findList");
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

    public Object checkTemplateName(String storeId, String templateName) {
        return performGet("/zk/template/checkTempName/" + storeId + "?templateName=" + templateName);
    }

    public Object addTemplate(Map<String, Object> request) {
        return performPost("/zk/template/addTemplateAllRefactor", request);
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
