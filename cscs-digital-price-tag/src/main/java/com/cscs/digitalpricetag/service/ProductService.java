package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.dto.ApiResponse;
import com.cscs.digitalpricetag.dto.api.PagedResponse;
import com.cscs.digitalpricetag.dto.api.ProductCreateRequest;
import com.cscs.digitalpricetag.dto.api.ProductResponse;
import com.cscs.digitalpricetag.dto.api.PriceUpdateRequest;
import com.cscs.digitalpricetag.dto.dragon.DragonProductListResponse;
import com.cscs.digitalpricetag.dto.dragon.DragonUpdateItemResponse;
import com.cscs.digitalpricetag.exception.DragonEslException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final DragonEslApiClient dragonEslApiClient;

    public ProductService(DragonEslApiClient dragonEslApiClient) {
        this.dragonEslApiClient = dragonEslApiClient;
    }

    /**
     * Fetch products from Dragon ESL for a given store.
     *
     * VERIFIED endpoint: POST /zk/item/list/{page}/0/{pageSize}/{storeId}
     * - page is 1-based in Dragon ESL (our API is 0-based → page + 1)
     * - second path segment is always 0 (verified fixed value)
     * - storeId is required — barcode alone is NOT unique across stores
     */
    @SuppressWarnings("unchecked")
    public PagedResponse<ProductResponse> getProducts(
            int page, int size, String storeId, String barcode, String search) {

        if (storeId == null || storeId.isBlank()) {
            throw new DragonEslException("storeId is required", HttpStatus.BAD_REQUEST);
        }

        int dragonPage = page + 1; // Dragon ESL is 1-based

        try {
            Map<String, Object> body = new HashMap<>();
            if (storeId != null && !storeId.isBlank()) {
                try {
                    body.put("storeId", Long.parseLong(storeId.trim()));
                } catch (NumberFormatException e) {
                    body.put("storeId", storeId.trim());
                }
            }
            if (barcode != null && !barcode.isBlank()) {
                body.put("barCode", barcode.trim());
                body.put("pcBarCode", barcode.trim());
            }
            if (search != null && !search.isBlank()) {
                body.put("itemTitle", search.trim());
            }
            
            Map<?, ?> response = dragonEslApiClient.post(
                    "/zk/item/list/" + dragonPage + "/0/" + size + "/" + storeId,
                    body,
                    Map.class
            );

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL", HttpStatus.BAD_GATEWAY);
            }

            log.info("Zkong getProducts response: {}", response);

            // Check success — Zkong uses "success" boolean or code 10000/200/14008
            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj) || Integer.valueOf(14008).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to fetch products: " + msg, HttpStatus.BAD_GATEWAY);
            }

            Object dataObj = response.get("data");
            List<ProductResponse> products = new ArrayList<>();
            long totalElements = 0;

            if (dataObj instanceof Map) {
                Map<String, Object> dataMap = (Map<String, Object>) dataObj;
                Object listObj = dataMap.get("list");
                if (listObj == null) {
                    listObj = dataMap.get("rows");
                }
                if (listObj instanceof List) {
                    List<Map<String, Object>> list = (List<Map<String, Object>>) listObj;
                    products = list.stream()
                            .map(this::mapFromRawMap)
                            .collect(Collectors.toList());
                }
                Object totalObj = dataMap.get("totalElements");
                if (totalObj == null) {
                    totalObj = dataMap.get("total");
                }
                if (totalObj == null) {
                    totalObj = dataMap.get("totalCount");
                }
                if (totalObj != null) {
                    if (totalObj instanceof Number) {
                        totalElements = ((Number) totalObj).longValue();
                    } else {
                        try {
                            totalElements = Long.parseLong(totalObj.toString().trim());
                        } catch (NumberFormatException e) {
                            log.warn("Failed to parse product total count from totalObj: {}", totalObj);
                        }
                    }
                }
            }

            // Apply barcode filter (exact match)
            final String barcodeFilter = (barcode != null && !barcode.isBlank()) ? barcode.trim() : null;

            // Apply search filter (name / itemCode partial match)
            final String searchLower = (search != null && !search.isBlank()) ? search.toLowerCase() : null;

            List<ProductResponse> filteredProducts = products.stream()
                    .filter(item -> barcodeFilter == null || barcodeFilter.equals(item.getBarcode()))
                    .filter(item -> {
                        if (searchLower == null) return true;
                        return (item.getItemName() != null && item.getItemName().toLowerCase().contains(searchLower))
                                || (item.getBarcode() != null && item.getBarcode().toLowerCase().contains(searchLower));
                    })
                    .collect(Collectors.toList());

            return new PagedResponse<>(filteredProducts, page, size, totalElements);

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching products: {}", e.getMessage());
            throw new DragonEslException("Product fetch failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    /**
     * Fetch single product by Dragon internal ID.
     *
     * VERIFIED: storeId is always required for product lookup.
     * Flow: fetch product list for storeId → find by Dragon internal id.
     */
    public ProductResponse getProductById(String id, String storeId) {
        PagedResponse<ProductResponse> all = getProducts(0, 100, storeId, null, null);
        return all.getContent().stream()
                .filter(p -> id.equals(p.getId()))
                .findFirst()
                .orElseThrow(() -> new DragonEslException("Product not found: " + id, HttpStatus.NOT_FOUND));
    }

    /**
     * Update product price using Dragon internal item ID.
     *
     * VERIFIED endpoint: PUT /zk/item/updateItem
     *
     * CRITICAL BUSINESS RULE (price transform):
     *   Frontend sends:   { "price": 75 }
     *   Dragon ESL needs: { "price": "75", "custFeature1": "75" }
     *
     * custFeature1 MUST always mirror price — ESL display templates depend on it.
     *
     * CRITICAL SAFETY RULE:
     *   NEVER update using barcode alone — barcode is NOT unique across stores.
     *   Always use Dragon internal item ID obtained from product list call.
     */
    /**
     * Fetch raw product details directly from Zkong.
     * VERIFIED endpoint: GET /zk/item/item/{id}?combinationShow=true
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getRawProductFromZkong(String itemId) {
        try {
            Map<?, ?> response = dragonEslApiClient.get(
                    "/zk/item/item/" + itemId + "?combinationShow=true",
                    Map.class
            );

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for item details lookup", HttpStatus.BAD_GATEWAY);
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

    /**
     * Update product price using Dragon internal item ID.
     *
     * VERIFIED endpoint: PUT /zk/item/pcItem/{id}
     *
     * CRITICAL BUSINESS RULE (price transform):
     *   Frontend sends:   { "price": 75 }
     *   Dragon ESL needs: { "price": "75", "custFeature1": "75" }
     *
     * custFeature1 MUST always mirror price — ESL display templates depend on it.
     *
     * CRITICAL SAFETY RULE:
     *   NEVER update using barcode alone — barcode is NOT unique across stores.
     *   Always use Dragon internal item ID obtained from product list call.
     */
    public void updatePrice(String itemId, PriceUpdateRequest request, String storeId) {
        if (itemId == null || itemId.isBlank()) {
            throw new DragonEslException("Item ID is required for price update", HttpStatus.BAD_REQUEST);
        }

        String priceStr = request.getPriceAsString();

        // 1. Retrieve the existing raw product details from Zkong to build a complete payload
        Map<String, Object> rawItem = getRawProductFromZkong(itemId);

        // 2. Build update payload by cloning/modifying the raw item
        Map<String, Object> body = new HashMap<>(rawItem);
        body.put("price", priceStr);
        body.put("custFeature1", priceStr); // Critical: display mirroring
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

    /**
     * Create a new product.
     * VERIFIED endpoint: POST /zk/item/item
     *
     * The `merchantId` and `type` are defaulted in the request DTO.
     * `custFeature1` must be mirrored from `price`.
     */
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
        body.put("custFeature1", priceStr); // Critical for ESL display
        body.put("originalPrice", originalPriceStr);
        body.put("unit", request.getUnit());
        body.put("merchantId", request.getMerchantId());
        body.put("storeId", request.getStoreId());
        body.put("attrCategory", request.getAttrCategory());
        body.put("attrName", request.getAttrName());
        body.put("type", request.getType());
        body.put("itemSpecsSkuVoList", Collections.emptyList());
        body.put("itemVideoList", Collections.emptyList());

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
     * Store-specific delete.
     * VERIFIED endpoint: DELETE /zk/item/businessDeleteItem/{id}
     * Removes product only from the specified store.
     */
    public void deleteFromStore(String itemId) {
        if (itemId == null || itemId.isBlank()) {
            throw new DragonEslException("Item ID is required for delete", HttpStatus.BAD_REQUEST);
        }

        try {
            Map<?, ?> response = dragonEslApiClient.delete(
                    "/zk/item/businessDeleteItem/" + itemId,
                    Map.class
            );

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL", HttpStatus.BAD_GATEWAY);
            }

            log.info("Zkong deleteFromStore response: {}", response);

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Store delete failed: " + msg, HttpStatus.BAD_GATEWAY);
            }

            log.info("Product {} deleted from store", itemId);

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting product from store: {}", e.getMessage());
            throw new DragonEslException("Store delete failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    /**
     * Global delete (removes product from all stores).
     * VERIFIED endpoint: DELETE /zk/item/deleteItem
     * Body must include id field.
     */
    public void deleteGlobal(String itemId) {
        if (itemId == null || itemId.isBlank()) {
            throw new DragonEslException("Item ID is required for global delete", HttpStatus.BAD_REQUEST);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("id", itemId);

        try {
            Map<?, ?> response = dragonEslApiClient.delete(
                    "/zk/item/deleteItem",
                    body,
                    Map.class
            );

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL", HttpStatus.BAD_GATEWAY);
            }

            log.info("Zkong deleteGlobal response: {}", response);

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Global delete failed: " + msg, HttpStatus.BAD_GATEWAY);
            }

            log.info("Product {} deleted globally", itemId);

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

        Object status = raw.get("status");
        if (status != null && Integer.valueOf(1).equals(status)) {
            r.setStatus("ACTIVE");
        } else {
            r.setStatus("INACTIVE");
        }
        return r;
    }
}
