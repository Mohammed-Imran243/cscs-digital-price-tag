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
            Map<String, Object> payload = new HashMap<>();
            payload.putAll(request);

            if (payload.containsKey("storeId") && payload.get("storeId") instanceof String) {
                payload.put("storeId", Long.parseLong(payload.get("storeId").toString()));
            }

            if (payload.containsKey("resolution")) {
                String resolution = payload.get("resolution").toString();
                String[] dimensions = resolution.split("\\*");
                if (dimensions.length == 2) {
                    payload.put("width", Integer.parseInt(dimensions[0]));
                    payload.put("height", Integer.parseInt(dimensions[1]));
                }
            }

            // Fix screenType: string "single" -> int 0
            if (payload.containsKey("screenType") && "single".equals(payload.get("screenType"))) {
                payload.put("screenType", 0);
            }

            // Mock modelId if missing
            if (!payload.containsKey("modelId")) {
                payload.put("modelId", "[65]"); // Default modelId format
            }

            payload.putIfAbsent("status", 1);
            payload.putIfAbsent("color", 1);
            payload.putIfAbsent("type", 1);
            payload.putIfAbsent("drawLayout", 1);
            payload.putIfAbsent("itemNum", 1);
            payload.putIfAbsent("templateType", 1);
            payload.putIfAbsent("templateSize", 1);
            payload.putIfAbsent("hardwareType", 1);
            payload.putIfAbsent("templateNumber", " ");
            payload.putIfAbsent("templateVersion", "1.0");
            payload.putIfAbsent("agencyId", 1694577214130L); // Default from user payload
            payload.putIfAbsent("sceneNumber", 1);
            payload.putIfAbsent("attrCategory", "default");
            payload.putIfAbsent("attrName", "default");

            Long merchantId = properties != null && properties.getMerchantId() != null
                    ? properties.getMerchantId()
                    : 1775639851383L;
            payload.putIfAbsent("merchantId", merchantId);
            
            // Extract items array for templateElements
            Object itemsObj = payload.remove("items");
            java.util.List<Map<String, Object>> mappedElements = new java.util.ArrayList<>();
            if (itemsObj instanceof java.util.List) {
                java.util.List<?> itemsList = (java.util.List<?>) itemsObj;
                int layerCount = 0;
                for (Object item : itemsList) {
                    if (item instanceof Map) {
                        Map<String, Object> source = (Map<String, Object>) item;
                        Map<String, Object> element = new HashMap<>();
                        
                        // Map type string to DragonESL type int
                        Object typeStr = source.get("type");
                        if ("text".equals(typeStr)) element.put("type", 1);
                        else if ("barcode".equals(typeStr)) element.put("type", 2);
                        else if ("qrcode".equals(typeStr)) element.put("type", 3);
                        else if ("line".equals(typeStr)) element.put("type", 4);
                        else if ("rect".equals(typeStr)) element.put("type", 5);
                        else element.put("type", 1);
                        
                        // Map coordinates
                        element.put("marginLeft", source.get("x"));
                        element.put("marginTop", source.get("y"));
                        element.put("width", source.get("width"));
                        element.put("height", source.get("height"));
                        
                        // Map text to content
                        element.put("content", source.containsKey("text") ? source.get("text") : "");
                        
                        // Map alignment
                        int align = 0;
                        if ("center".equals(source.get("textAlign"))) align = 1;
                        else if ("right".equals(source.get("textAlign"))) align = 2;
                        element.put("horizontalAlign", align);
                        
                        // Map font
                        element.put("fontSize", source.getOrDefault("fontSize", 14));
                        String fontFam = (String) source.getOrDefault("fontFamily", "Arial");
                        if ("Inter".equals(fontFam) || "Roboto".equals(fontFam)) {
                            fontFam = "Arial"; // Zkong backend crashes if font is not installed on their server
                        }
                        element.put("fontType", fontFam);
                        
                        // Map colors
                        element.put("color", source.getOrDefault("color", "#000000"));
                        element.put("borderColor", source.getOrDefault("borderColor", "#000000"));
                        element.put("fillColor", "");
                        element.put("fillinColor", "");
                        element.put("stroke", "#000000");

                        // Add exact DragonESL defaults
                        element.put("id", null);
                        element.put("angle", 0);
                        element.put("barcodeType", 10);
                        element.put("borderType", 1);
                        element.put("conRealResult", 1);
                        element.put("dateFormat", "YYYY-MM-dd HH:mm:ss");
                        element.put("decimalSeparator", "point");
                        element.put("fieldCode", "");
                        element.put("icon", null);
                        element.put("ifBold", 0);
                        element.put("ifCondition", 0);
                        element.put("ifItalic", 0);
                        element.put("ifStrikeThrough", 0);
                        element.put("ifUnderline", 0);
                        element.put("itemOrder", layerCount + 1);
                        element.put("itemPictureNameId", null);
                        element.put("layer", layerCount++);
                        element.put("lineBreak", "");
                        element.put("lineWeight", source.getOrDefault("borderWidth", 0));
                        element.put("maxLines", 3);
                        element.put("minFontSize", 12);
                        element.put("noResourceHide", 0);
                        element.put("omitStyle", 0);
                        element.put("postfix", "");
                        element.put("prefix", "");
                        element.put("scaleX", 0);
                        element.put("scaleY", 0);
                        element.put("screenIndex", 0);
                        element.put("strokeWidth", 0);
                        element.put("textAdvanceProperty", 0);
                        element.put("thousandSeparator", "comma");
                        element.put("verticalAlign", 0);
                        element.put("verticalSpace", 0);

                        mappedElements.add(element);
                    }
                }
            }
            
            Map<String, Object> finalPayload = new HashMap<>();
            finalPayload.put("templateBase", payload);
            finalPayload.put("templateElementAdvancedAttributes", null);
            finalPayload.put("templateElements", mappedElements);

            log.info("Creating template with final payload: {}", finalPayload);

            DragonTemplateGenericResponse response = dragonEslApiClient.post(
                    "/zk/template/addTemplateAllRefactor",
                    finalPayload,
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