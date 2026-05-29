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

            if (search != null && !search.isBlank()) {
                // Fetch first page of size 10 to find totalElements and get first batch
                String firstPageUri = "/zk/item/list/0/1/10/" + storeId;
                log.info("Search active. Fetching first page: URI={}, Body={}", firstPageUri, body);
                Map<?, ?> firstResp = dragonEslApiClient.post(firstPageUri, body, Map.class);
                if (hasItems(firstResp)) {
                    responses.add(firstResp);
                }

                long totalElements = 0;
                if (firstResp != null) {
                    Object dataObj = firstResp.get("data");
                    if (dataObj instanceof Map) {
                        Map<?, ?> dataMap = (Map<?, ?>) dataObj;
                        Object totalObj = dataMap.get("totalElements");
                        if (totalObj == null) totalObj = dataMap.get("total");
                        if (totalObj == null) totalObj = dataMap.get("totalCount");
                        if (totalObj instanceof Number) {
                            totalElements = ((Number) totalObj).longValue();
                        } else if (totalObj != null) {
                            try {
                                totalElements = Long.parseLong(totalObj.toString().trim());
                            } catch (NumberFormatException e) {
                                // ignore
                            }
                        }
                    }
                }

                log.info("Search active. First page loaded. Total elements in Zkong: {}", totalElements);

                if (totalElements > 10) {
                    List<CompletableFuture<Map<?, ?>>> futures = new ArrayList<>();
                    // limit search to fetch up to 200 items (20 pages of 10) to keep it safe and performant
                    long maxPages = Math.min((totalElements + 9) / 10, 20); 
                    log.info("Fetching remaining search pages in parallel: pages 2 to {}", maxPages);
                    for (int p = 2; p <= maxPages; p++) {
                        final int pageNum = p;
                        futures.add(CompletableFuture.supplyAsync(() -> 
                            dragonEslApiClient.post(
                                    "/zk/item/list/0/" + pageNum + "/10/" + storeId,
                                    body,
                                    Map.class
                            )
                        ));
                    }

                    if (!futures.isEmpty()) {
                        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
                        for (CompletableFuture<Map<?, ?>> f : futures) {
                            try {
                                Map<?, ?> resp = f.get();
                                if (hasItems(resp)) {
                                    responses.add(resp);
                                }
                            } catch (Exception e) {
                                log.error("Error fetching remaining search pages", e);
                            }
                        }
                    }
                }
            } else {
                if (size <= 50) {
                    String normalUri = "/zk/item/list/0/" + (page + 1) + "/" + size + "/" + storeId;
                    log.info("Normal pagination active. Querying Zkong with: URI={}, Body={}", normalUri, body);
                    Map<?, ?> normalResp = dragonEslApiClient.post(normalUri, body, Map.class);
                    if (hasItems(normalResp)) {
                        responses.add(normalResp);
                    }
                } else {
                    log.info("Requested size {} > 50. Fetching multiple chunks from Zkong.", size);
                    int zkongPageSize = 50;
                    int startItemIndex = page * size;
                    int endItemIndex = startItemIndex + size;
                    
                    int startZkongPage = (startItemIndex / zkongPageSize) + 1;
                    int endZkongPage = ((endItemIndex - 1) / zkongPageSize) + 1;
                    
                    List<CompletableFuture<Map<?, ?>>> futures = new ArrayList<>();
                    // To prevent overloading Zkong API with huge 'All' requests, limit concurrent fetching to max 40 pages (2000 items)
                    endZkongPage = Math.min(endZkongPage, startZkongPage + 39);
                    
                    for (int p = startZkongPage; p <= endZkongPage; p++) {
                        final int pageNum = p;
                        futures.add(CompletableFuture.supplyAsync(() -> 
                            dragonEslApiClient.post(
                                    "/zk/item/list/0/" + pageNum + "/" + zkongPageSize + "/" + storeId,
                                    body,
                                    Map.class
                            )
                        ));
                    }
                    
                    if (!futures.isEmpty()) {
                        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
                        // Maintain order of pages by iterating in the same order futures were added
                        for (CompletableFuture<Map<?, ?>> f : futures) {
                            try {
                                Map<?, ?> resp = f.get();
                                if (hasItems(resp)) {
                                    responses.add(resp);
                                }
                            } catch (Exception e) {
                                log.error("Error fetching chunked pages for large size", e);
                            }
                        }
                    }
                }
            }

            if (responses.isEmpty()) {
                log.warn("No items returned from Zkong API for this query.");
                return new PagedResponse<>(Collections.emptyList(), page, size, 0);
            }

            return mergeAndParseResponses(responses, page, size, barcodeFilter, searchLower);

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching products: {}", e.getMessage());
            throw new DragonEslException("Product fetch failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    @SuppressWarnings("unchecked")
    private PagedResponse<ProductResponse> mergeAndParseResponses(
            List<Map<?, ?>> responses, int page, int size, String barcodeFilter, String searchLower) {
        
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

        int start = (searchLower != null || barcodeFilter != null) ? Math.min(page * size, filteredProducts.size()) : 0;
        int end = Math.min(start + size, filteredProducts.size());
        log.info("Slicing local list: start={}, end={}, totalElements={}", start, end, totalElements);
        List<ProductResponse> pagedList = filteredProducts.subList(start, end);

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

        String priceStr = request.getPriceAsString();

        Map<String, Object> rawItem = getRawProductFromZkong(itemId);
        Map<String, Object> body = new HashMap<>(rawItem);
        body.put("price", priceStr);
        body.put("custFeature1", priceStr);
        body.put("id", Long.valueOf(itemId));
        body.put("storeId", Long.valueOf(storeId));

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
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(17019).equals(codeObj) || Integer.valueOf(200).equals(codeObj) || Integer.valueOf(10000).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Price update failed: " + msg, HttpStatus.BAD_GATEWAY);
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
                    "/zk/item/list/0/" + page + "/" + size + "/" + storeId,
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
                    "/zk/item/list/0/" + page + "/" + size + "/" + storeId,
                    titleBody,
                    Map.class
            );
        } catch (Exception e) {
            log.warn("Failed title query for: {}", titleValue, e);
            return null;
        }
    }
}