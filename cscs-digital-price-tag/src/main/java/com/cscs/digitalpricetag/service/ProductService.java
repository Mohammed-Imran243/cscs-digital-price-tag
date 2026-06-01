package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.dto.api.PagedResponse;
import com.cscs.digitalpricetag.dto.api.ProductCreateRequest;
import com.cscs.digitalpricetag.dto.api.ProductResponse;
import com.cscs.digitalpricetag.dto.api.PriceUpdateRequest;
import com.cscs.digitalpricetag.dto.dragon.DragonProductListResponse;
import com.cscs.digitalpricetag.exception.DragonEslException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final DragonEslApiClient dragonEslApiClient;

    public ProductService(DragonEslApiClient dragonEslApiClient) {
        this.dragonEslApiClient = dragonEslApiClient;
    }

    @SuppressWarnings("unchecked")
    public PagedResponse<ProductResponse> getProducts(
            int page, int size, String storeId, String barcode, String search) {

        if (storeId == null || storeId.isBlank()) {
            throw new DragonEslException("storeId is required", HttpStatus.BAD_REQUEST);
        }

        log.info("getProducts called with page={}, size={}, storeId={}, barcode={}, search={}", page, size, storeId, barcode, search);

        try {
            Map<String, Object> body = new HashMap<>();
            if (storeId != null && !storeId.isBlank()) {
                try {
                    body.put("storeId", Long.parseLong(storeId.trim()));
                } catch (NumberFormatException e) {
                    body.put("storeId", storeId.trim());
                }
            }

            // If a specific barcode parameter is passed
            if (barcode != null && !barcode.isBlank()) {
                body.put("barCode", barcode.trim());
                body.put("pcBarCode", barcode.trim());
            }

            final String barcodeFilter = (barcode != null && !barcode.isBlank()) ? barcode.trim() : null;
            final String searchLower = (search != null && !search.isBlank()) ? search.toLowerCase() : null;

            List<Map<?, ?>> responses = new ArrayList<>();

            int localStart = 0;

            if (search != null && !search.isBlank()) {
                int zkongPage = page + 1; // Zkong uses 1-based indexing

                log.info("Performing native Zkong API search for term: {}", search);
                
                // Try barcode search
                Map<?, ?> barcodeResp = queryBarcode(body, search.trim(), zkongPage, size, storeId);
                if (hasItems(barcodeResp)) {
                    responses.add(barcodeResp);
                }
                
                // Try title search
                Map<?, ?> titleResp = queryTitle(body, search.trim(), zkongPage, size, storeId);
                if (hasItems(titleResp)) {
                    responses.add(titleResp);
                }

                // If both are empty, we have no results
                if (responses.isEmpty()) {
                    return new PagedResponse<>(Collections.emptyList(), page, size, 0);
                }
            } else {
                log.info("Fetching chunks from Zkong by strictly enforcing zkongPageSize=50 (API constraint).");
                int zkongPageSize = 50;
                int startItemIndex = page * size;
                int endItemIndex = startItemIndex + size;
                
                // Zkong uses 1-based indexing for page
                int startZkongPage = (startItemIndex / zkongPageSize) + 1;
                int endZkongPage = ((endItemIndex - 1) / zkongPageSize) + 1;
                
                // To prevent overloading Zkong API with huge requests, limit fetching to max 40 pages and do it sequentially
                endZkongPage = Math.min(endZkongPage, startZkongPage + 39);
                
                for (int p = startZkongPage; p <= endZkongPage; p++) {
                    try {
                        Map<?, ?> resp = dragonEslApiClient.post(
                                "/zk/item/list/" + p + "/0/" + zkongPageSize + "/" + storeId,
                                body,
                                Map.class
                        );
                        if (hasItems(resp)) {
                            responses.add(resp);
                        }
                        if (p < endZkongPage) {
                            Thread.sleep(200); // Rate limit protection
                        }
                    } catch (Exception e) {
                        log.error("Error fetching chunked page " + p, e);
                        try {
                            java.io.File file = new java.io.File("C:\\Users\\NICK\\Downloads\\debug_pagination.txt");
                            try (java.io.FileWriter fw = new java.io.FileWriter(file, true)) {
                                fw.write("EXCEPTION on Zkong Page " + p + ": " + e.getMessage() + "\n");
                            }
                        } catch (Exception ex) {}
                    }
                }
                
                localStart = startItemIndex - ((startZkongPage - 1) * zkongPageSize);
            }

            if (responses.isEmpty()) {
                log.warn("No items returned from Zkong API for this query.");
                try {
                    java.io.File file = new java.io.File("C:\\Users\\NICK\\Downloads\\debug_pagination.txt");
                    try (java.io.FileWriter fw = new java.io.FileWriter(file, true)) {
                        fw.write("RESPONSES EMPTY for Page " + page + " Size " + size + "\n\n");
                    }
                } catch (Exception ex) {}
                return new PagedResponse<>(Collections.emptyList(), page, size, 0);
            }

            return mergeAndParseResponses(responses, page, size, barcodeFilter, searchLower, localStart);

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching products: {}", e.getMessage());
            throw new DragonEslException("Product fetch failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    @SuppressWarnings("unchecked")
    private PagedResponse<ProductResponse> mergeAndParseResponses(
            List<Map<?, ?>> responses, int page, int size, String barcodeFilter, String searchLower, int localStart) {
        
        Map<String, ProductResponse> deduplicated = new LinkedHashMap<>();
        long totalElements = 0;

        for (Map<?, ?> response : responses) {
            Object dataObj = response.get("data");
            if (dataObj instanceof Map) {
                Map<String, Object> dataMap = (Map<String, Object>) dataObj;
                Object listObj = dataMap.get("list");
                if (listObj == null) {
                    listObj = dataMap.get("rows");
                }
                if (listObj instanceof List) {
                    List<Map<String, Object>> list = (List<Map<String, Object>>) listObj;
                    for (Map<String, Object> rawItem : list) {
                        ProductResponse p = mapFromRawMap(rawItem);
                        if (p != null && p.getId() != null) {
                            deduplicated.put(p.getId(), p);
                        }
                    }
                }
                
                Object totalObj = dataMap.get("totalElements");
                if (totalObj == null) totalObj = dataMap.get("total");
                if (totalObj == null) totalObj = dataMap.get("totalCount");
                if (totalObj != null) {
                    long total = 0;
                    if (totalObj instanceof Number) {
                        total = ((Number) totalObj).longValue();
                    } else {
                        try {
                            total = Long.parseLong(totalObj.toString().trim());
                        } catch (NumberFormatException e) {
                            // ignore
                        }
                    }
                    if (total > totalElements) {
                        totalElements = total;
                    }
                }
            }
        }

        log.info("Deduplicated product count from Zkong: {}", deduplicated.size());

        List<ProductResponse> filteredProducts = deduplicated.values().stream()
                .filter(item -> barcodeFilter == null || barcodeFilter.equals(item.getBarcode()))
                .filter(item -> {
                    if (searchLower == null) return true;
                    boolean matchesName = (item.getItemName() != null && item.getItemName().toLowerCase().contains(searchLower));
                    boolean matchesBarcode = (item.getBarcode() != null && item.getBarcode().toLowerCase().contains(searchLower));
                    if (matchesName || matchesBarcode) {
                        log.info("Match found: name='{}', barcode='{}'", item.getItemName(), item.getBarcode());
                    }
                    return matchesName || matchesBarcode;
                })
                .collect(Collectors.toList());

        log.info("Filtered product count: {}", filteredProducts.size());

        if (searchLower != null || barcodeFilter != null) {
            totalElements = filteredProducts.size();
        }

        int start = Math.min(localStart, filteredProducts.size());
        int end = Math.min(start + size, filteredProducts.size());
        log.info("Slicing local list: start={}, end={}, totalElements={}", start, end, totalElements);
        List<ProductResponse> pagedList = filteredProducts.subList(start, end);

        try {
            java.io.File file = new java.io.File("C:\\Users\\NICK\\Downloads\\debug_pagination.txt");
            try (java.io.FileWriter fw = new java.io.FileWriter(file, true)) {
                fw.write("=== DEBUG CALL ===\n");
                fw.write("Requested Page: " + page + " | Size: " + size + " | LocalStart: " + localStart + "\n");
                fw.write("FilteredProducts Size: " + filteredProducts.size() + "\n");
                fw.write("Calculated Start: " + start + " | Calculated End: " + end + "\n");
                fw.write("TotalElements extracted: " + totalElements + "\n");
                fw.write("PagedList Size: " + pagedList.size() + "\n");
                fw.write("Zkong Responses Count: " + responses.size() + "\n");
                fw.write("==================\n\n");
            }
        } catch (Exception e) {
        }

        return new PagedResponse<>(pagedList, page, size, totalElements);
    }

    public ProductResponse getProductById(String id, String storeId) {
        PagedResponse<ProductResponse> all = getProducts(0, 100, storeId, null, null);
        return all.getContent().stream()
                .filter(p -> id.equals(p.getId()))
                .findFirst()
                .orElseThrow(() -> new DragonEslException("Product not found: " + id, HttpStatus.NOT_FOUND));
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getRawProductFromZkong(String itemId) {
        try {
            Map<?, ?> response = dragonEslApiClient.get(
                    "/zk/item/item/" + itemId + "?combinationShow=true",
                    Map.class
            );

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for item details", HttpStatus.BAD_GATEWAY);
            }

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(17021).equals(codeObj) || Integer.valueOf(200).equals(codeObj) || Integer.valueOf(10000).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to get product details: " + msg, HttpStatus.BAD_GATEWAY);
            }

            Object data = response.get("data");
            if (data instanceof Map) {
                return (Map<String, Object>) data;
            }

            throw new DragonEslException("Invalid item details data type from Dragon ESL", HttpStatus.BAD_GATEWAY);

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching raw product from Zkong: {}", e.getMessage());
            throw new DragonEslException("Item lookup failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    public void updatePrice(String itemId, PriceUpdateRequest request, String storeId) {
        if (itemId == null || itemId.isBlank()) {
            throw new DragonEslException("Item ID is required for price update", HttpStatus.BAD_REQUEST);
        }

        String priceStr         = request.getPriceAsString();
        String originalPriceStr = request.getOriginalPriceAsString();

        // Build clean whitelist body — mirrors exactly what Dragon ESL UI sends on PUT
        // DO NOT dump the full GET response back — Dragon ESL rejects its own read-only fields
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id",                       null);
        body.put("productCode",              request.getProductCode());
        body.put("barCode",                  request.getBarCode());
        body.put("productSku",               null);
        body.put("itemTitle",                request.getItemTitle());
        body.put("shortTitle",               null);
        body.put("classLevel",               null);
        body.put("productArea",              request.getOrigin());
        body.put("unit",                     request.getUnit());
        body.put("spec",                     request.getSpec());
        body.put("price",                    priceStr);
        body.put("originalPrice",            originalPriceStr);
        body.put("memberPrice",              request.getVipPrice() != null ? request.getVipPrice().toString() : null);
        body.put("proStartTime",             null);
        body.put("proEndTime",               null);
        body.put("promotionText",            null);
        body.put("qrCode",                   null);
        body.put("nfcUrl",                   null);
        body.put("stock1",                   null);
        body.put("stock2",                   null);
        body.put("stock3",                   null);
        body.put("label",                    request.getProductLabel());
        body.put("attrCategory",             request.getAttrCategory());
        body.put("attrName",                 request.getAttrName());
        body.put("isSpecs",                  "0");
        body.put("storeId",                  "0");
        body.put("custFeature1",             priceStr);
        body.put("custFeature2",             null);
        body.put("custFeature3",             null);
        body.put("custFeature4",             null);
        body.put("custFeature5",             null);
        body.put("custFeature6",             null);
        body.put("custFeature7",             null);
        body.put("custFeature8",             null);
        body.put("custFeature9",             null);
        body.put("custFeature10",            null);
        body.put("custFeature11",            null);
        body.put("custFeature12",            null);
        body.put("custFeature13",            null);
        body.put("custFeature14",            null);
        body.put("custFeature15",            null);
        body.put("custFeature16",            null);
        body.put("custFeature17",            null);
        body.put("custFeature18",            null);
        body.put("custFeature19",            null);
        body.put("custFeature20",            null);
        body.put("custFeature21",            null);
        body.put("custFeature22",            null);
        body.put("custFeature23",            null);
        body.put("custFeature24",            null);
        body.put("custFeature25",            null);
        body.put("custFeature26",            null);
        body.put("custFeature27",            null);
        body.put("custFeature28",            null);
        body.put("custFeature29",            null);
        body.put("custFeature30",            null);
        body.put("custFeature31",            null);
        body.put("custFeature32",            null);
        body.put("custFeature33",            null);
        body.put("custFeature34",            null);
        body.put("custFeature35",            null);
        body.put("custFeature36",            null);
        body.put("custFeature37",            null);
        body.put("custFeature38",            null);
        body.put("custFeature39",            null);
        body.put("custFeature40",            null);
        body.put("custFeature41",            null);
        body.put("custFeature42",            null);
        body.put("custFeature43",            null);
        body.put("custFeature44",            null);
        body.put("custFeature45",            null);
        body.put("custFeature46",            null);
        body.put("custFeature47",            null);
        body.put("custFeature48",            null);
        body.put("custFeature49",            null);
        body.put("custFeature50",            null);
        body.put("itemExt",                  null);
        body.put("data",                     Collections.emptyList());
        body.put("delPicIds",                Collections.emptyList());
        body.put("itemPictureList",          Collections.emptyList());
        body.put("itemSkuList",              Collections.emptyList());
        body.put("itemSpecsGroupBeanList",   Collections.singletonList(
                Map.of("type", "", "contentList", Collections.emptyList())
        ));
        body.put("itemSpecsSkuVoList",       Collections.emptyList());
        body.put("itemVideoList",            Collections.emptyList());

        log.info("updatePrice body for itemId={} storeId={}: price={} custFeature1={}",
                itemId, storeId, priceStr, priceStr);

        try {
            Map<?, ?> response = dragonEslApiClient.put(
                    "/zk/item/pcItem/" + itemId,
                    body,
                    Map.class
            );

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL", HttpStatus.BAD_GATEWAY);
            }

            log.info("Zkong updatePrice response: {}", response);

            Object successObj = response.get("success");
            boolean success   = Boolean.TRUE.equals(successObj);
            Object codeObj    = response.get("code");
            boolean codeOk    = codeObj != null && (
                    Integer.valueOf(17019).equals(codeObj) ||
                    Integer.valueOf(200).equals(codeObj)   ||
                    Integer.valueOf(10000).equals(codeObj)
            );

            if (!success && !codeOk) {
                String msg = response.get("message") != null
                        ? response.get("message").toString()
                        : "Unknown error";
                throw new DragonEslException(
                        "Dragon ESL PUT /zk/item/pcItem/" + itemId + " failed: " + msg,
                        HttpStatus.BAD_GATEWAY
                );
            }

            log.info("Price updated for item {} in store {} to {}", itemId, storeId, priceStr);

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating price: {}", e.getMessage());
            throw new DragonEslException("Price update failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    public void createProduct(ProductCreateRequest request) {
        if (request.getBarCode() == null || request.getBarCode().isBlank()) {
            throw new DragonEslException("Barcode is required", HttpStatus.BAD_REQUEST);
        }

        String priceStr = request.getPriceAsString();
        String originalPriceStr = request.getOriginalPriceAsString();

        Map<String, Object> body = new HashMap<>();
        body.put("itemTitle", request.getItemTitle());
        body.put("productCode", request.getProductCode() != null ? request.getProductCode() : request.getBarCode());
        body.put("barCode", request.getBarCode());
        body.put("price", priceStr);
        body.put("custFeature1", priceStr);
        body.put("originalPrice", originalPriceStr);
        body.put("unit", request.getUnit());
        body.put("merchantId", request.getMerchantId());
        body.put("storeId", request.getStoreId());
        body.put("attrCategory", request.getAttrCategory());
        body.put("attrName", request.getAttrName());
        body.put("type", request.getType());
        body.put("itemSpecsSkuVoList", Collections.emptyList());
        body.put("itemVideoList", Collections.emptyList());
        if (request.getVipPrice() != null) body.put("vipPrice", request.getVipPrice());
        if (request.getSpec() != null && !request.getSpec().isBlank()) body.put("spec", request.getSpec());
        if (request.getProductLabel() != null && !request.getProductLabel().isBlank()) body.put("productLabel", request.getProductLabel());
        if (request.getOrigin() != null && !request.getOrigin().isBlank()) body.put("origin", request.getOrigin());

        try {
            Map<?, ?> response = dragonEslApiClient.post(
                    "/zk/item/item",
                    body,
                    Map.class
            );

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL", HttpStatus.BAD_GATEWAY);
            }

            log.info("Zkong createProduct response: {}", response);

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Product creation failed: " + msg, HttpStatus.BAD_GATEWAY);
            }

            log.info("Product {} created successfully for store {}", request.getBarCode(), request.getStoreId());

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating product: {}", e.getMessage());
            throw new DragonEslException("Product creation failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    /**
     * Store-specific delete — removes product from ONE store only.
     * DragonESL: DELETE /zk/item/batchDeleteItem
     * Body: { "storeId": "<storeId>", "list": ["<barcode>"] }
     */
    public void deleteFromStore(String itemId, String storeId, String barcode) {
        if (barcode == null || barcode.isBlank()) {
            throw new DragonEslException("Barcode is required for delete", HttpStatus.BAD_REQUEST);
        }
        if (storeId == null || storeId.isBlank()) {
            throw new DragonEslException("StoreId is required for store delete", HttpStatus.BAD_REQUEST);
        }

        try {
            Map<String, Object> body = new HashMap<>();
            body.put("storeId", storeId);
            body.put("list", Collections.singletonList(barcode));

            Map<?, ?> response = dragonEslApiClient.delete(
                    "/zk/item/batchDeleteItem",
                    body,
                    Map.class
            );

            if (response != null) {
                Object codeObj = response.get("code");
                Object successObj = response.get("success");
                boolean codeOk = codeObj != null &&
                        (Integer.valueOf(200).equals(codeObj) || Integer.valueOf(10000).equals(codeObj));
                boolean success = Boolean.TRUE.equals(successObj);
                if (!success && !codeOk) {
                    String msg = response.get("message") != null ?
                            response.get("message").toString() : "Unknown error";
                    throw new DragonEslException("Delete from store failed: " + msg, HttpStatus.BAD_GATEWAY);
                }
            }

            log.info("Product barcode {} deleted from store {}", barcode, storeId);

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting from store: {}", e.getMessage());
            throw new DragonEslException("Delete from store failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    /**
     * Global delete — removes product from ALL stores.
     * DragonESL: DELETE /zk/item/batchDeleteItem
     * Body: { "storeId": "", "list": ["<barcode>"] }
     */
    public void deleteGlobal(String itemId, String barcode) {
        if (barcode == null || barcode.isBlank()) {
            throw new DragonEslException("Barcode is required for global delete", HttpStatus.BAD_REQUEST);
        }

        try {
            Map<String, Object> body = new HashMap<>();
            body.put("storeId", "");
            body.put("list", Collections.singletonList(barcode));

            Map<?, ?> response = dragonEslApiClient.delete(
                    "/zk/item/batchDeleteItem",
                    body,
                    Map.class
            );

            if (response != null) {
                Object codeObj = response.get("code");
                Object successObj = response.get("success");
                boolean codeOk = codeObj != null &&
                        (Integer.valueOf(200).equals(codeObj) || Integer.valueOf(10000).equals(codeObj));
                boolean success = Boolean.TRUE.equals(successObj);
                if (!success && !codeOk) {
                    String msg = response.get("message") != null ?
                            response.get("message").toString() : "Unknown error";
                    throw new DragonEslException("Global delete failed: " + msg, HttpStatus.BAD_GATEWAY);
                }
            }

            log.info("Product barcode {} deleted globally", barcode);

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting product globally: {}", e.getMessage());
            throw new DragonEslException("Global delete failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    private ProductResponse mapToProductResponse(DragonProductListResponse.DragonProductItem item) {
        ProductResponse r = new ProductResponse();
        r.setId(item.getId());
        r.setBarcode(item.getItemCode());
        r.setItemName(item.getItemName());
        r.setPrice(item.getPrice());
        r.setOriginalPrice(item.getOriginalPrice() != null ? item.getOriginalPrice() : (item.getCustFeature2() != null ? item.getCustFeature2() : null));
        r.setStoreId(item.getStoreId());
        r.setStatus(Integer.valueOf(1).equals(item.getStatus()) ? "ACTIVE" : "INACTIVE");
        r.setCategory(item.getCategoryName());
        return r;
    }

    private ProductResponse mapFromRawMap(Map<String, Object> raw) {
        if (raw == null) return null;
        ProductResponse r = new ProductResponse();
        r.setId(raw.get("id") != null ? raw.get("id").toString() : null);
        r.setBarcode(raw.get("barCode") != null ? raw.get("barCode").toString() : (raw.get("itemCode") != null ? raw.get("itemCode").toString() : null));
        r.setItemName(raw.get("itemTitle") != null ? raw.get("itemTitle").toString() : (raw.get("itemName") != null ? raw.get("itemName").toString() : null));
        r.setPrice(raw.get("price") != null ? raw.get("price").toString() : null);
        r.setOriginalPrice(raw.get("originalPrice") != null ? raw.get("originalPrice").toString() : (raw.get("custFeature2") != null ? raw.get("custFeature2").toString() : null));
        r.setStoreId(raw.get("storeId") != null ? raw.get("storeId").toString() : null);
        r.setCategory(raw.get("categoryName") != null ? raw.get("categoryName").toString() : (raw.get("attrCategory") != null ? raw.get("attrCategory").toString() : null));

        Object bindState = raw.get("bindState");
        Object state = raw.get("state");
        String bindStr = bindState != null ? String.valueOf(bindState) : "";
        String stateStr = state != null ? String.valueOf(state) : "";
        boolean isActive = "1".equals(bindStr) || "1".equals(stateStr);
        r.setStatus(isActive ? "ACTIVE" : "INACTIVE");

        // attrName and attrCategory for edit modal
        if (raw.get("attrName") != null) r.setAttrName(raw.get("attrName").toString());
        if (raw.get("attrCategory") != null) r.setAttrCategory(raw.get("attrCategory").toString());
        if (raw.get("unit") != null) r.setUnit(raw.get("unit").toString());

        r.setVipPrice(raw.get("vipPrice") != null ? Double.parseDouble(raw.get("vipPrice").toString()) : null);
        r.setSpec(raw.get("spec") != null ? raw.get("spec").toString() : null);
        r.setProductLabel(raw.get("productLabel") != null ? raw.get("productLabel").toString() : null);
        r.setOrigin(raw.get("origin") != null ? raw.get("origin").toString() : null);

        return r;
    }

    private Map<?, ?> queryBarcode(Map<String, Object> baseBody, String barcodeValue, int page, int size, String storeId) {
        Map<String, Object> barcodeBody = new HashMap<>(baseBody);
        barcodeBody.put("barCode", barcodeValue);
        barcodeBody.put("pcBarCode", barcodeValue);
        try {
            return dragonEslApiClient.post(
                    "/zk/item/list/" + page + "/0/" + size + "/" + storeId,
                    barcodeBody,
                    Map.class
            );
        } catch (Exception e) {
            log.warn("Failed barcode query for: {}", barcodeValue, e);
            return null;
        }
    }

    private boolean hasItems(Map<?, ?> response) {
        if (response == null || !Boolean.TRUE.equals(response.get("success"))) {
            return false;
        }
        Object dataObj = response.get("data");
        if (dataObj instanceof Map) {
            Map<String, Object> dataMap = (Map<String, Object>) dataObj;
            Object listObj = dataMap.get("list");
            if (listObj == null) listObj = dataMap.get("rows");
            if (listObj instanceof List && !((List<?>) listObj).isEmpty()) {
                return true;
            }
        }
        return false;
    }

    private Map<?, ?> queryTitle(Map<String, Object> baseBody, String titleValue, int page, int size, String storeId) {
        Map<String, Object> titleBody = new HashMap<>(baseBody);
        titleBody.put("itemTitle", titleValue);
        try {
            return dragonEslApiClient.post(
                    "/zk/item/list/" + page + "/0/" + size + "/" + storeId,
                    titleBody,
                    Map.class
            );
        } catch (Exception e) {
            log.warn("Failed title query for: {}", titleValue, e);
            return null;
        }
    }
} 
