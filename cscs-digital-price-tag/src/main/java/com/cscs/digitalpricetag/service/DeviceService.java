package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.dto.ApResponse;
import com.cscs.digitalpricetag.dto.EslResponse;
import com.cscs.digitalpricetag.dto.PagedResponse;
import com.cscs.digitalpricetag.exception.DragonEslException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DeviceService {

    private static final Logger log = LoggerFactory.getLogger(DeviceService.class);

    private final DragonEslApiClient dragonEslApiClient;

    public DeviceService(DragonEslApiClient dragonEslApiClient) {
        this.dragonEslApiClient = dragonEslApiClient;
    }

    /**
     * Fetch ESL devices with Zkong's POST /zk/erp/esl/list?page={page}&size={size}
     */
    @SuppressWarnings("unchecked")
    public PagedResponse<EslResponse> getEslDevices(int page, int size, String storeId, String search) {
        try {
            // Zkong pagination
            int dragonPage = page; // Zkong uses 0-based index (page 1 is 0)

            // Construct body
            Map<String, Object> body = new HashMap<>();
            if (storeId != null && !storeId.isBlank()) {
                try {
                    body.put("storeId", Long.parseLong(storeId.trim()));
                } catch (NumberFormatException e) {
                    body.put("storeId", storeId.trim());
                }
            }

            // Apply search parameters
            if (search != null && !search.isBlank()) {
                String cleanSearch = search.trim();
                // If it looks like an ESL barcode (usually numbers), put it in priceTagCode
                if (cleanSearch.matches("\\d{6,}")) {
                    body.put("priceTagCode", cleanSearch);
                    body.put("itemBarCode", "");
                    body.put("itemTitle", "");
                } else if (cleanSearch.matches("[a-zA-Z0-9_-]+")) {
                    // Alphanumeric search term represents item barcode (SKU)
                    body.put("itemBarCode", cleanSearch);
                    body.put("priceTagCode", "");
                    body.put("itemTitle", "");
                } else {
                    // Search term with spaces or non-alphanumeric represents title
                    body.put("itemTitle", cleanSearch);
                    body.put("itemBarCode", "");
                    body.put("priceTagCode", "");
                }
            } else {
                body.put("itemBarCode", "");
                body.put("itemTitle", "");
                body.put("priceTagCode", "");
                body.put("oemModel", "");
                body.put("shelfNo", "");
            }

            String url = String.format("/zk/erp/esl/list?page=%d&size=%d", dragonPage, size);
            Map<?, ?> response = dragonEslApiClient.post(url, body, Map.class);

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for ESL list", HttpStatus.BAD_GATEWAY);
            }

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(13001).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to fetch ESL list: " + msg, HttpStatus.BAD_GATEWAY);
            }

            List<EslResponse> eslList = new ArrayList<>();
            long totalElements = 0;

            Object dataObj = response.get("data");
            if (dataObj instanceof Map) {
                Map<String, Object> dataMap = (Map<String, Object>) dataObj;
                Object listObj = dataMap.get("list");
                if (listObj == null) {
                    listObj = dataMap.get("rows");
                }
                if (listObj instanceof List) {
                    List<Map<String, Object>> list = (List<Map<String, Object>>) listObj;
                    eslList = list.stream()
                            .map(this::mapToEslResponse)
                            .collect(Collectors.toList());
                }

                Object totalObj = dataMap.get("totalElements");
                if (totalObj == null) {
                    totalObj = dataMap.get("total");
                }
                if (totalObj != null) {
                    if (totalObj instanceof Number) {
                        totalElements = ((Number) totalObj).longValue();
                    } else {
                        try {
                            totalElements = Long.parseLong(totalObj.toString().trim());
                        } catch (NumberFormatException e) {
                            log.warn("Failed to parse ESL total count: {}", totalObj);
                        }
                    }
                }
            }

            return new PagedResponse<>(eslList, page, size, totalElements);

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching ESL list: {}", e.getMessage(), e);
            throw new DragonEslException("ESL fetch failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    /**
     * Fetch AP base stations with Zkong's POST /zk/erp/ap/list?storeId={storeId}&page={page}&size={size}
     */
    @SuppressWarnings("unchecked")
    public PagedResponse<ApResponse> getApDevices(int page, int size, String storeId, String search) {
        try {
            int dragonPage = page; // Zkong uses 0-based page index
            
            // Build query parameters
            StringBuilder urlBuilder = new StringBuilder("/zk/erp/ap/list");
            urlBuilder.append("?page=").append(dragonPage);
            urlBuilder.append("&size=").append(size);

            if (storeId != null && !storeId.isBlank()) {
                urlBuilder.append("&storeId=").append(storeId.trim());
            }
            if (search != null && !search.isBlank() && search.trim().matches("^[a-fA-F0-9:]{8,}$")) {
                urlBuilder.append("&mac=").append(search.trim());
            }

            Map<String, Object> body = new HashMap<>(); // Zkong requires POST, payload can be empty

            Map<?, ?> response = dragonEslApiClient.post(urlBuilder.toString(), body, Map.class);

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for AP list", HttpStatus.BAD_GATEWAY);
            }

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to fetch AP list: " + msg, HttpStatus.BAD_GATEWAY);
            }

            List<ApResponse> apList = new ArrayList<>();
            long totalElements = 0;

            Object dataObj = response.get("data");
            if (dataObj instanceof Map) {
                Map<String, Object> dataMap = (Map<String, Object>) dataObj;
                Object listObj = dataMap.get("list");
                if (listObj == null) {
                    listObj = dataMap.get("rows");
                }
                if (listObj instanceof List) {
                    List<Map<String, Object>> list = (List<Map<String, Object>>) listObj;
                    apList = list.stream()
                            .map(this::mapToApResponse)
                            .collect(Collectors.toList());
                }

                Object totalObj = dataMap.get("totalElements");
                if (totalObj == null) {
                    totalObj = dataMap.get("total");
                }
                if (totalObj != null) {
                    if (totalObj instanceof Number) {
                        totalElements = ((Number) totalObj).longValue();
                    } else {
                        try {
                            totalElements = Long.parseLong(totalObj.toString().trim());
                        } catch (NumberFormatException e) {
                            log.warn("Failed to parse AP total count: {}", totalObj);
                        }
                    }
                }
            }

            // Local filtering for AP search if needed
            if (search != null && !search.isBlank()) {
                final String lowerSearch = search.toLowerCase().trim();
                apList = apList.stream()
                        .filter(ap -> (ap.getApName() != null && ap.getApName().toLowerCase().contains(lowerSearch))
                                || (ap.getMac() != null && ap.getMac().toLowerCase().contains(lowerSearch))
                                || (ap.getIp() != null && ap.getIp().contains(lowerSearch)))
                        .collect(Collectors.toList());
            }

            return new PagedResponse<>(apList, page, size, totalElements);

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching AP list: {}", e.getMessage(), e);
            throw new DragonEslException("AP fetch failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    /**
     * Reboot a specific ESL tag using POST /zk/pricetag/eslReboot
     */
    @SuppressWarnings("unchecked")
    public void rebootEsl(String barcode) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("barcodeList", Collections.singletonList(barcode));

            Map<?, ?> response = dragonEslApiClient.post("/zk/pricetag/eslReboot", body, Map.class);

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for ESL Reboot", HttpStatus.BAD_GATEWAY);
            }

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(15011).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to reboot ESL tag: " + msg, HttpStatus.BAD_GATEWAY);
            }

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error rebooting ESL tag: {}", e.getMessage(), e);
            throw new DragonEslException("ESL tag reboot failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    /**
     * Query live tag telemetry, bound items list, and visual preview e-ink render.
     * Uses Zkong's GET /zk/bind/viewBindPicByBarcode
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getEslDetail(String barcode) {
        try {
            String url = "/zk/bind/viewBindPicByBarcode?barcode=" + barcode.trim();
            Map<?, ?> response = dragonEslApiClient.get(url, Map.class);

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for ESL details", HttpStatus.BAD_GATEWAY);
            }

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to fetch ESL details: " + msg, HttpStatus.BAD_GATEWAY);
            }

            Map<String, Object> data = (Map<String, Object>) response.get("data");
            if (data != null) {
                // Fetch the bound product information using Zkong's /zk/bind/geyItemByPriceTagBarCode
                try {
                    Map<String, Object> bindItemBody = new HashMap<>();
                    bindItemBody.put("priceTagBarCode", barcode.trim());
                    Map<?, ?> itemResponse = dragonEslApiClient.post("/zk/bind/geyItemByPriceTagBarCode", bindItemBody, Map.class);
                    if (itemResponse != null && Boolean.TRUE.equals(itemResponse.get("success"))) {
                        Object itemData = itemResponse.get("data");
                        if (itemData != null) {
                            data.put("boundProduct", itemData);
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to fetch bound product details for tag {}: {}", barcode, e.getMessage());
                }
            }
            return data;
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching ESL details: {}", e.getMessage(), e);
            throw new DragonEslException("ESL details fetch failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    /**
     * Force refresh selected ESL labels.
     * Uses Zkong's POST /zk/bind/updateForceByBarCodes?useExternalStoreId=0
     */
    @SuppressWarnings("unchecked")
    public void forceRefreshEsl(String storeId, List<String> barcodes) {
        try {
            Map<String, Object> body = new HashMap<>();
            
            // Try to parse internal store ID as a Number/Long as required by Zkong
            try {
                body.put("storeId", Long.parseLong(storeId.trim()));
            } catch (NumberFormatException e) {
                body.put("storeId", storeId.trim());
            }
            body.put("barCodeList", barcodes);

            Map<?, ?> response = dragonEslApiClient.post("/zk/bind/updateForceByBarCodes?useExternalStoreId=0", body, Map.class);

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for Force Refresh", HttpStatus.BAD_GATEWAY);
            }

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to force refresh ESL: " + msg, HttpStatus.BAD_GATEWAY);
            }

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error force refreshing ESL labels: {}", e.getMessage(), e);
            throw new DragonEslException("ESL force refresh failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    /**
     * Fetch unbound (available) ESL devices — bindState=0.
     * Used to populate the ESL dropdown in the bind workflow.
     */
    @SuppressWarnings("unchecked")
    public List<EslResponse> getAvailableEslDevices(String storeId) {
        try {
            Map<String, Object> body = new HashMap<>();
            if (storeId != null && !storeId.isBlank()) {
                try {
                    body.put("storeId", Long.parseLong(storeId.trim()));
                } catch (NumberFormatException e) {
                    body.put("storeId", storeId.trim());
                }
            }
            body.put("bindState", 0); // 0 = unbound
            body.put("itemBarCode", "");
            body.put("itemTitle", "");
            body.put("priceTagCode", "");

            String url = "/zk/erp/esl/list?page=0&size=200";
            Map<?, ?> response = dragonEslApiClient.post(url, body, Map.class);

            if (response == null) {
                throw new DragonEslException("No response for available ESL list", HttpStatus.BAD_GATEWAY);
            }

            List<EslResponse> eslList = new ArrayList<>();
            Object dataObj = response.get("data");
            if (dataObj instanceof Map) {
                Map<String, Object> dataMap = (Map<String, Object>) dataObj;
                Object listObj = dataMap.get("list");
                if (listObj == null) listObj = dataMap.get("rows");
                if (listObj instanceof List) {
                    eslList = ((List<Map<String, Object>>) listObj).stream()
                            .map(this::mapToEslResponse)
                            .collect(Collectors.toList());
                }
            }
            return eslList;
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching available ESL list: {}", e.getMessage(), e);
            throw new DragonEslException("Available ESL fetch failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    /**
     * Bind an ESL device to a product item barcode.
     *
     * VERIFIED endpoint (API doc 4.1 + DevTools confirmed):
     *   POST /zk/bind/bindItemPriceTag/1
     *
     * Payload: { storeId, itemBarCode, priceTagCode, shelfNum, apMac }
     * Success codes: 13006 (bind OK, image sending)
     */
    @SuppressWarnings("unchecked")
    public void bindEsl(String storeId, String itemBarCode, String eslBarcode, String apMac) {
        try {
            Map<String, Object> body = new HashMap<>();
            try {
                body.put("storeId", Long.parseLong(storeId.trim()));
            } catch (NumberFormatException e) {
                body.put("storeId", storeId.trim());
            }
            body.put("itemBarCode", itemBarCode.trim());
            body.put("priceTagCode", eslBarcode.trim()); // field name per API doc
            body.put("shelfNum", "");                    // optional shelf number
            if (apMac != null && !apMac.isBlank()) {
                body.put("apMac", apMac.trim());
            }

            log.info("ESL Bind request -> storeId={}, itemBarCode={}, priceTagCode={}, apMac={}",
                    storeId, itemBarCode, eslBarcode, apMac);

            Map<?, ?> response = dragonEslApiClient.post("/zk/bind/bindItemPriceTag/1", body, Map.class);

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for bind operation", HttpStatus.BAD_GATEWAY);
            }

            log.info("ESL Bind response: {}", response);

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            // 13006 = bind successful, image sending; 10000 = general success
            boolean codeOk = codeObj != null && (
                Integer.valueOf(13006).equals(codeObj) ||
                Integer.valueOf(10000).equals(codeObj) ||
                Integer.valueOf(200).equals(codeObj)
            );

            if (!success && !codeOk) {
                String msg = translateZkongBindError(codeObj);
                throw new DragonEslException("ESL bind failed: " + msg, HttpStatus.BAD_REQUEST);
            }

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error binding ESL: {}", e.getMessage(), e);
            throw new DragonEslException("ESL bind operation failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    /**
     * Unbind one or more ESL devices from their bound products.
     *
     * VERIFIED endpoint (API doc 4.3):
     *   POST /zk/bind/batchUnbind
     *
     * Payload: { storeId, tagItemBinds: [{ eslBarcode }] }
     */
    @SuppressWarnings("unchecked")
    public void unbindEsl(String storeId, List<String> eslBarcodes) {
        try {
            Map<String, Object> body = new HashMap<>();
            try {
                body.put("storeId", Long.parseLong(storeId.trim()));
            } catch (NumberFormatException e) {
                body.put("storeId", storeId.trim());
            }

            // API doc 4.3: tagItemBinds is a list of objects with eslBarcode
            List<Map<String, String>> tagItemBinds = new ArrayList<>();
            for (String barcode : eslBarcodes) {
                Map<String, String> entry = new HashMap<>();
                entry.put("eslBarcode", barcode.trim());
                tagItemBinds.add(entry);
            }
            body.put("tagItemBinds", tagItemBinds);

            log.info("ESL Unbind request -> storeId={}, barcodes={}", storeId, eslBarcodes);

            Map<?, ?> response = dragonEslApiClient.post("/zk/bind/batchUnbind", body, Map.class);

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for unbind operation", HttpStatus.BAD_GATEWAY);
            }

            log.info("ESL Unbind response: {}", response);

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = translateZkongBindError(codeObj);
                throw new DragonEslException("ESL unbind failed: " + msg, HttpStatus.BAD_REQUEST);
            }

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error unbinding ESL: {}", e.getMessage(), e);
            throw new DragonEslException("ESL unbind operation failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    /**
     * Translate Zkong API error codes to readable English messages.
     * Avoids passing garbled Chinese characters through to the frontend.
     * Reference: API doc Appendix 1 + empirical testing.
     */
    private String translateZkongBindError(Object codeObj) {
        if (codeObj == null) return "Unknown error from Dragon ESL";
        int code;
        try { code = Integer.parseInt(codeObj.toString()); }
        catch (NumberFormatException e) { return "Dragon ESL error: " + codeObj; }

        return switch (code) {
            case 17004 -> "Product does not exist in Dragon ESL. Please sync the product first before binding.";
            case 15069 -> "ESL device not found. The barcode may be invalid or the device is not registered.";
            case 13008 -> "ESL is already bound to another product. Unbind it first.";
            case 13030 -> "Some ESL labels are already unbound.";
            case 13040 -> "No binding relationship found for this ESL.";
            case 15006 -> "ESL device is offline. Binding requires the device to be online.";
            case 12001 -> "Store not found or access denied.";
            case 10001 -> "Authentication failed. Please refresh and try again.";
            case 13006 -> "Bind successful — image is being sent to the ESL label.";
            case 19001 -> "ESL barcode list is empty.";
            case 19015 -> "No matching store found for the given store ID.";
            default    -> "Dragon ESL error code " + code + ". Please check the ESL API documentation.";
        };
    }

    // ── Mappers ──────────────────────────────────────────────────────────────


    private EslResponse mapToEslResponse(Map<String, Object> raw) {
        EslResponse r = new EslResponse();
        r.setId(raw.get("id") != null ? raw.get("id").toString() : null);
        r.setPriceTagCode(raw.get("priceTagCode") != null ? raw.get("priceTagCode").toString() : null);
        r.setOemModel(raw.get("oemModel") != null ? raw.get("oemModel").toString() : null);
        r.setItemBarCode(raw.get("itemBarCode") != null ? raw.get("itemBarCode").toString() : null);
        r.setItemTitle(raw.get("itemTitle") != null ? raw.get("itemTitle").toString() : null);

        Object stateObj = raw.get("state");
        if (stateObj != null && (Integer.valueOf(1).equals(stateObj) || "1".equals(stateObj.toString()))) {
            r.setState("ONLINE");
        } else {
            r.setState("OFFLINE");
        }

        if (raw.get("battery") != null) {
            try {
                r.setBattery(Integer.parseInt(raw.get("battery").toString()));
            } catch (NumberFormatException e) {
                r.setBattery(100);
            }
        } else {
            r.setBattery(100);
        }

        if (raw.get("batteryLevel") != null) {
            try {
                r.setBatteryLevel(Integer.parseInt(raw.get("batteryLevel").toString()));
            } catch (NumberFormatException e) {
                r.setBatteryLevel(5);
            }
        } else {
            r.setBatteryLevel(5);
        }

        if (raw.get("bindState") != null) {
            try {
                r.setBindState(Integer.parseInt(raw.get("bindState").toString()));
            } catch (NumberFormatException ignored) {}
        }

        if (raw.get("apSignal") != null) {
            try {
                r.setApSignal(Integer.parseInt(raw.get("apSignal").toString()));
            } catch (NumberFormatException ignored) {}
        }

        r.setLastCommuTime(raw.get("lastCommuTime") != null ? raw.get("lastCommuTime").toString() : null);
        r.setUpdateTime(raw.get("updateTime") != null ? raw.get("updateTime").toString() : null);
        r.setBindTime(raw.get("bindTime") != null ? raw.get("bindTime").toString() : null);
        r.setStoreId(raw.get("storeId") != null ? raw.get("storeId").toString() : null);

        return r;
    }

    private ApResponse mapToApResponse(Map<String, Object> raw) {
        ApResponse r = new ApResponse();
        r.setId(raw.get("id") != null ? raw.get("id").toString() : null);
        r.setApName(raw.get("apName") != null ? raw.get("apName").toString() : null);
        r.setMac(raw.get("mac") != null ? raw.get("mac").toString() : null);
        r.setModel(raw.get("model") != null ? raw.get("model").toString() : null);
        r.setIp(raw.get("ip") != null ? raw.get("ip").toString() : null);

        if (raw.get("eslCount") != null) {
            try {
                r.setEslCount(Integer.parseInt(raw.get("eslCount").toString()));
            } catch (NumberFormatException e) {
                r.setEslCount(0);
            }
        } else {
            r.setEslCount(0);
        }

        Object onlineObj = raw.get("online");
        if (onlineObj != null) {
            String os = onlineObj.toString().trim();
            if ("1".equals(os)) {
                r.setOnline("ONLINE");
            } else if ("2".equals(os)) {
                r.setOnline("UPGRADING");
            } else if ("3".equals(os)) {
                r.setOnline("UPGRADE_FAILED");
            } else {
                r.setOnline("OFFLINE");
            }
        } else {
            r.setOnline("OFFLINE");
        }

        if (raw.get("reboot_state") != null) {
            try {
                r.setRebootState(Integer.parseInt(raw.get("reboot_state").toString()));
            } catch (NumberFormatException ignored) {}
        }

        r.setSoftVersion(raw.get("softVersion") != null ? raw.get("softVersion").toString() : null);
        r.setJoinTime(raw.get("joinTime") != null ? raw.get("joinTime").toString() : null);
        r.setStoreId(raw.get("storeId") != null ? raw.get("storeId").toString() : null);

        return r;
    }
}
