package com.cscs.digitalpricetag.dto.dragon;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Maps raw Dragon ESL response from:
 * POST /zk/item/list/1/0/10/{storeId}
 *
 * Envelope:
 * {
 *   "code": 200,
 *   "msg": "success",
 *   "data": {
 *     "total": 100,
 *     "list": [ { ... } ]
 *   }
 * }
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class DragonProductListResponse {

    @JsonProperty("code")
    private Integer code;

    @JsonProperty("msg")
    private String msg;

    @JsonProperty("data")
    private DragonProductData data;

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Integer getCode() { return code; }
    public void setCode(Integer code) { this.code = code; }

    public String getMsg() { return msg; }
    public void setMsg(String msg) { this.msg = msg; }

    public DragonProductData getData() { return data; }
    public void setData(DragonProductData data) { this.data = data; }

    public boolean isSuccess() {
        return code != null && (code == 10000 || code == 200);
    }

    // ── Nested: data wrapper ────────────────────────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DragonProductData {

        @JsonProperty("total")
        private Long total;

        @JsonProperty("list")
        private List<DragonProductItem> list;

        public Long getTotal() { return total != null ? total : 0L; }
        public void setTotal(Long total) { this.total = total; }

        public List<DragonProductItem> getList() { return list; }
        public void setList(List<DragonProductItem> list) { this.list = list; }
    }

    // ── Nested: individual product/item ─────────────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DragonProductItem {

        /** Dragon ESL internal ID — MUST be used for update/delete, never barcode alone */
        @JsonProperty("id")
        private String id;

        @JsonProperty("itemCode")
        private String itemCode;    // barcode

        @JsonProperty("itemName")
        private String itemName;

        @JsonProperty("price")
        private String price;

        @JsonProperty("custFeature1")
        private String custFeature1;

        @JsonProperty("storeId")
        private String storeId;

        @JsonProperty("storeName")
        private String storeName;

        @JsonProperty("status")
        private Integer status;

        @JsonProperty("imageUrl")
        private String imageUrl;

        @JsonProperty("unit")
        private String unit;

        @JsonProperty("categoryName")
        private String categoryName;

        @JsonProperty("originalPrice")
        private String originalPrice;

        @JsonProperty("custFeature2")
        private String custFeature2;

        // ── Getters & Setters ──────────────────────────────────────────────

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getItemCode() { return itemCode; }
        public void setItemCode(String itemCode) { this.itemCode = itemCode; }

        public String getItemName() { return itemName; }
        public void setItemName(String itemName) { this.itemName = itemName; }

        public String getPrice() { return price; }
        public void setPrice(String price) { this.price = price; }

        public String getCustFeature1() { return custFeature1; }
        public void setCustFeature1(String custFeature1) { this.custFeature1 = custFeature1; }

        public String getStoreId() { return storeId; }
        public void setStoreId(String storeId) { this.storeId = storeId; }

        public String getStoreName() { return storeName; }
        public void setStoreName(String storeName) { this.storeName = storeName; }

        public Integer getStatus() { return status; }
        public void setStatus(Integer status) { this.status = status; }

        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }

        public String getCategoryName() { return categoryName; }
        public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

        public String getOriginalPrice() { return originalPrice; }
        public void setOriginalPrice(String originalPrice) { this.originalPrice = originalPrice; }

        public String getCustFeature2() { return custFeature2; }
        public void setCustFeature2(String custFeature2) { this.custFeature2 = custFeature2; }
    }
}


