package com.cscs.digitalpricetag.dto.api;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ProductResponse {

    private String id;           // Dragon ESL internal item ID — used for update/delete
    private String barcode;
    private String itemName;
    private String price;
    private String custFeature1; // must mirror price — ESL template dependency
    private String storeId;
    private String storeName;
    private String status;
    private String originalPrice;
    private String imageUrl;
    private String unit;
    private String category;

    // ── Constructors ────────────────────────────────────────────────────────

    public ProductResponse() {}

    // ── Getters & Setters ───────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

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

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(String originalPrice) { this.originalPrice = originalPrice; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
