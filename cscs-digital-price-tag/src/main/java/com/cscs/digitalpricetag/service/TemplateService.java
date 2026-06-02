package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.config.DragonEslProperties;
import com.cscs.digitalpricetag.dto.dragon.DragonTemplateGenericResponse;
import com.cscs.digitalpricetag.dto.dragon.DragonTemplateListResponse;
import com.cscs.digitalpricetag.exception.DragonEslException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TemplateService {

    private static final Logger log = LoggerFactory.getLogger(TemplateService.class);
    private final DragonEslApiClient dragonEslApiClient;
    private final DragonEslProperties properties;
    private final IconService iconService;

    public TemplateService(DragonEslApiClient dragonEslApiClient, DragonEslProperties properties, IconService iconService) {
        this.dragonEslApiClient = dragonEslApiClient;
        this.properties = properties;
        this.iconService = iconService;
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

    public Object addCategory(Map<String, Object> request) {
        return performPost("/zk/attrCategory/add", request);
    }

    public Object getModels() {
        return performGet("/zk/pricetagModel/getAll");
    }

    public DragonTemplateListResponse getTemplates(int page, int size, Map<String, Object> searchParams) {
        try {
            int dragonPage = page;

            Map<String, Object> requestBody = searchParams != null ? searchParams : new HashMap<>();

            if (requestBody.containsKey("storeId")) {
                Object storeIdObj = requestBody.get("storeId");
                if (storeIdObj instanceof String && !((String) storeIdObj).isBlank()) {
                    try {
                        requestBody.put("storeId", Long.parseLong(storeIdObj.toString().trim()));
                    } catch (NumberFormatException e) {
                        log.warn("Could not parse storeId: {}", storeIdObj);
                    }
                }
            }

            String endpoint = "/zk/template/list/" + dragonPage + "/" + size;
            log.info("Fetching templates from endpoint: {} with body: {}", endpoint, requestBody);

            DragonTemplateListResponse response = dragonEslApiClient.post(
                    endpoint,
                    requestBody,
                    DragonTemplateListResponse.class
            );

            if (response == null) {
                log.error("Received null response from Dragon ESL");
                throw new RuntimeException("Received null response from Dragon ESL");
            }

            if (!response.isSuccess()) {
                String msg = response.getMessage() != null ? response.getMessage() : "Unknown error";
                log.error("Failed to fetch templates: {} (code: {})", msg, response.getCode());
                throw new RuntimeException("Failed to fetch templates: " + msg);
            }

            if (response.getData() == null) {
                log.warn("Response data is null");
                // Create empty data but with success=true
                DragonTemplateListResponse emptyResponse = new DragonTemplateListResponse();
                emptyResponse.setSuccess(true);
                emptyResponse.setCode(10000);
                DragonTemplateListResponse.DragonTemplateData emptyData = new DragonTemplateListResponse.DragonTemplateData();
                emptyData.setContent(new ArrayList<>());
                emptyData.setTotalElements(0L);
                emptyData.setTotalPages(0L);
                emptyData.setNumberOfElements(0L);
                emptyResponse.setData(emptyData);
                return emptyResponse;
            }

            // Ensure content is not null
            if (response.getData().getContent() == null) {
                response.getData().setContent(new ArrayList<>());
            }

            return response;

        } catch (Exception e) {
            log.error("Error fetching templates: {}", e.getMessage(), e);
            // Return null to indicate error to frontend
            return null;
        }
    }

    public Object getTemplateBaseById(String id) {
        return performGet("/zk/template/getTemplateBaseById/" + id);
    }

    public Object checkTemplateName(String storeId, String templateName) {
        return performGet("/zk/template/checkTempName/" + storeId + "?templateName=" + templateName);
    }

    public Object getFontTypes() {
        return performGet("/zk/sys/getFontType/en");
    }

    public Object getMaxSubNum(String storeId) {
        return performGet("/zk/sys/getMaxSubNum/" + storeId);
    }

    public Object getPictureNames(String storeId) {
        return performGet("/zk/itemPicName/picName?combinationShow=true&storeId=" + storeId);
    }

    public Object getFieldNames(String type) {
        return performGet("/zk/sys/getFieldNames/" + type);
    }


    public Object addTemplate(Map<String, Object> request) {
        try {
            log.info("Creating template with final payload: {}", request);

            DragonTemplateGenericResponse response = dragonEslApiClient.post(
                    "/zk/template/addTemplateAllRefactor",
                    request, // publish requires it unwrapped (templateBase at root)
                    DragonTemplateGenericResponse.class
            );

            if (response == null || !response.isSuccess()) {
                String msg = response != null ? response.getMessage() : "No response";
                log.error("Template creation failed: {}", msg);
                throw new DragonEslException("Failed to create template: " + msg, HttpStatus.BAD_REQUEST);
            }

            log.info("Template created successfully");
            return response.getData() != null ? response.getData() : response;

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating template: {}", e.getMessage(), e);
            throw new DragonEslException("Template creation failed: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    public Object previewTemplate(Map<String, Object> request) {
        try {
            // Preview endpoint expects the payload wrapped in "templateAllRefactor"
            Map<String, Object> finalPayload = new HashMap<>();
            finalPayload.put("templateAllRefactor", request);

            // DragonESL requires itemBarcodeMap to process a commodity preview
            if (request.containsKey("templateBase")) {
                Map<String, Object> templateBase = (Map<String, Object>) request.get("templateBase");
                if (templateBase != null && templateBase.containsKey("barCode")) {
                    Map<String, String> itemBarcodeMap = new HashMap<>();
                    itemBarcodeMap.put("1", String.valueOf(templateBase.get("barCode")));
                    finalPayload.put("itemBarcodeMap", itemBarcodeMap);
                }
            }

            log.info("Previewing template with payload: {}", finalPayload);

            DragonTemplateGenericResponse response = dragonEslApiClient.post(
                    "/zk/template/specifyCommodityPreviewTemplate",
                    finalPayload,
                    DragonTemplateGenericResponse.class
            );

            if (response == null || !response.isSuccess()) {
                String msg = response != null ? response.getMessage() : "No response";
                log.error("Template preview failed: {}", msg);
                throw new DragonEslException("Failed to preview template: " + msg, HttpStatus.BAD_REQUEST);
            }

            return response.getData() != null ? response.getData() : response;

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error previewing template: {}", e.getMessage(), e);
            throw new DragonEslException("Template preview failed: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
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
        String compelFlag = isCompel ? "1" : "0";
        Map<String, Object> body = new HashMap<>();
        return performPut("/zk/template/delete/" + id + "/" + compelFlag, body);
    }

    public Object findIconsInTemplate(String templateId) {
        return iconService.findIconsInTemplate(templateId);
    }

    public Object addIconToTemplate(String templateId, Map<String, Object> iconData) {
        return iconService.addIconToTemplate(templateId, iconData);
    }

    public Object removeIconFromTemplate(String templateId, String iconId) {
        return iconService.removeIconFromTemplate(templateId, iconId);
    }

    public Object updateIconInTemplate(String templateId, String iconId, Map<String, Object> updateData) {
        return iconService.updateIconInTemplate(templateId, iconId, updateData);
    }

    public Object getStoreIcons(int page, int size, Map<String, Object> params) {
        try {
            Map<String, Object> body = new HashMap<>();
            if (params != null) {
                body.putAll(params);
            }

            if (body.containsKey("storeId")) {
                Object storeIdObj = body.get("storeId");
                if (storeIdObj != null && !storeIdObj.toString().trim().isEmpty()) {
                    try {
                        long storeIdLong = Long.parseLong(storeIdObj.toString().trim());
                        body.put("storeId", storeIdLong);
                    } catch (NumberFormatException e) {
                        log.warn("Could not parse storeId string to long for getStoreIcons: {}", storeIdObj);
                    }
                }
            }

            Map<?, ?> response = dragonEslApiClient.post(
                    "/zk/icon/list/" + page + "/" + size,
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

    private DragonTemplateListResponse createEmptyResponse() {
        DragonTemplateListResponse emptyResponse = new DragonTemplateListResponse();
        emptyResponse.setSuccess(true);
        emptyResponse.setCode(10000);  // Dragon ESL success code
        emptyResponse.setMessage("Empty response");

        DragonTemplateListResponse.DragonTemplateData emptyData = new DragonTemplateListResponse.DragonTemplateData();
        emptyData.setContent(new ArrayList<>());  // Empty list of templates
        emptyData.setTotalElements(0L);           // Long value
        emptyData.setTotalPages(0L);              // Long value, not int
        emptyData.setNumberOfElements(0L);        // Long value

        emptyResponse.setData(emptyData);
        return emptyResponse;
    }

    private Object performGet(String url) {
        try {
            DragonTemplateGenericResponse response = dragonEslApiClient.get(
                    url,
                    DragonTemplateGenericResponse.class
            );
            if (response == null || !response.isSuccess()) {
                String msg = response != null ? response.getMessage() : "No response";
                throw new DragonEslException(msg, HttpStatus.BAD_REQUEST);
            }
            return response.getData() != null ? response.getData() : response;
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error on GET {}: {}", url, e.getMessage());
            throw new DragonEslException(extractErrorDetails(e), HttpStatus.BAD_REQUEST);
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
                throw new DragonEslException(msg, HttpStatus.BAD_REQUEST);
            }
            return response.getData() != null ? response.getData() : response;
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error on POST {}: {}", url, e.getMessage());
            throw new DragonEslException(extractErrorDetails(e), HttpStatus.BAD_REQUEST);
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
                throw new DragonEslException(msg, HttpStatus.BAD_REQUEST);
            }
            return response.getData() != null ? response.getData() : response;
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error on PUT {}: {}", url, e.getMessage());
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