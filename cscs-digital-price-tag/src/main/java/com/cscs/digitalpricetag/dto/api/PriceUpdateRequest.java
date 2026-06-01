package com.cscs.digitalpricetag.dto.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class PriceUpdateRequest {

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;

    private String itemTitle;
    private String productCode;
    private String barCode;
    private BigDecimal originalPrice;
    private String attrCategory;
    private String attrName;
    private String unit;
    private BigDecimal vipPrice;
    private String     spec;
    private String     origin;
    private String     productLabel;

    // ── Constructors ────────────────────────────────────────────────────────

    public PriceUpdateRequest() {}

    public PriceUpdateRequest(BigDecimal price) {
        this.price = price;
    }

    // ── Getters & Setters ───────────────────────────────────────────────────

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getItemTitle() { return itemTitle; }
    public void setItemTitle(String itemTitle) { this.itemTitle = itemTitle; }

    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }

    public String getBarCode() { return barCode; }
    public void setBarCode(String barCode) { this.barCode = barCode; }

    public BigDecimal getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(BigDecimal originalPrice) { this.originalPrice = originalPrice; }

    public String getAttrCategory() { return attrCategory; }
    public void setAttrCategory(String attrCategory) { this.attrCategory = attrCategory; }

    public String getAttrName() { return attrName; }
    public void setAttrName(String attrName) { this.attrName = attrName; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    /**
     * Returns price as plain string — no scientific notation, no trailing zeros.
     * e.g. 75 → "75",  75.50 → "75.50"
     */
    public String getPriceAsString() {
        return price != null ? price.stripTrailingZeros().toPlainString() : null;
    }

    public BigDecimal getVipPrice() { return vipPrice; }
    public void setVipPrice(BigDecimal vipPrice) { this.vipPrice = vipPrice; }

    public String getSpec() { return spec; }
    public void setSpec(String spec) { this.spec = spec; }

    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }

    public String getProductLabel() { return productLabel; }
    public void setProductLabel(String productLabel) { this.productLabel = productLabel; }

    public String getOriginalPriceAsString() {
        return originalPrice != null ? originalPrice.stripTrailingZeros().toPlainString() : null;
    }
}
