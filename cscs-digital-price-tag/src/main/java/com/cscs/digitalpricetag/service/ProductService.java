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
                    "/zk/item/list/0/" + page + "/" + size + "/" + storeId,
                    body,
                    Map.class
            );

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL", HttpStatus.BAD_GATEWAY);
            }

            log.info("Zkong getProducts response: {}", response);

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
                if (totalObj == null) totalObj = dataMap.get("total");
                if (totalObj == null) totalObj = dataMap.get("totalCount");
                if (totalObj != null) {
                    if (totalObj instanceof Number) {
                        totalElements = ((Number) totalObj).longValue();
                    } else {
                        try {
                            totalElements = Long.parseLong(totalObj.toString().trim());
                        } catch (NumberFormatException e) {
                            log.warn("Failed to parse product total count: {}", totalObj);
                        }
                    }
                }
            }

            final String barcodeFilter = (barcode != null && !barcode.isBlank()) ? barcode.trim() : null;
            final String searchLower = (search != null && !search.isBlank()) ? search.toLowerCase() : null;

            List<ProductResponse> filteredProducts = products.stream()
                    .filter(item -> barcodeFilter == null || barcodeFilter.equals(item.getBarcode()))
                    .filter(item -> {
                        if (searchLower == null) return true;
                        return (item.getItemName() != null && item.getItemName().toLowerCase().contains(searchLower))
                                || (item.getBarcode() != null && item.getBarcode().toLowerCase().contains(searchLower));
                    })
                    .collect(Collectors.toList());

            if (filteredProducts.isEmpty() && page > 0) {
                totalElements = (long) page * size;
            }

            return new PagedResponse<>(filteredProducts, page, size, totalElements);

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching products: {}", e.getMessage());
            throw new DragonEslException("Product fetch failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
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

        return r;
    }
}