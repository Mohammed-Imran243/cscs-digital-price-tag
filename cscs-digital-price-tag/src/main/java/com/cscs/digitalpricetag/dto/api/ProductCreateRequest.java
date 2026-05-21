package com.cscs.digitalpricetag.dto.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ProductCreateRequest {

    @NotBlank(message = "Item Title is required")
    private String itemTitle;

    private String productCode;

    @NotBlank(message = "Barcode is required")
    private String barCode;

    @NotNull(message = "Price is required")
    private Double price;

    private Double originalPrice;

    private String unit;

    @NotBlank(message = "Store ID is required")
    private String storeId;

    private String attrCategory;

    private String attrName;

    private Integer type = 0; // Default to 0 (general product)

    private String merchantId = "1775639851383"; // Default merchant ID for DG0358

    public String getItemTitle() { return itemTitle; }
    public void setItemTitle(String itemTitle) { this.itemTitle = itemTitle; }

    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }

    public String getBarCode() { return barCode; }
    public void setBarCode(String barCode) { this.barCode = barCode; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Double getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(Double originalPrice) { this.originalPrice = originalPrice; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public String getAttrCategory() { return attrCategory; }
    public void setAttrCategory(String attrCategory) { this.attrCategory = attrCategory; }

    public String getAttrName() { return attrName; }
    public void setAttrName(String attrName) { this.attrName = attrName; }

    public Integer getType() { return type; }
    public void setType(Integer type) { this.type = type; }

    public String getMerchantId() { return merchantId; }
    public void setMerchantId(String merchantId) { this.merchantId = merchantId; }
    
    // Helper to get price as string
    public String getPriceAsString() {
        if (price == null) return null;
        if (price == price.intValue()) {
            return String.valueOf(price.intValue());
        }
        return String.valueOf(price);
    }
    
    public String getOriginalPriceAsString() {
        if (originalPrice == null) return null;
        if (originalPrice == originalPrice.intValue()) {
            return String.valueOf(originalPrice.intValue());
        }
        return String.valueOf(originalPrice);
    }
}
