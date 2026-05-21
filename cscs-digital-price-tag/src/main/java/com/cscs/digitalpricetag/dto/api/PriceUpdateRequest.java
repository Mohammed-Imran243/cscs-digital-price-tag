package com.cscs.digitalpricetag.dto.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class PriceUpdateRequest {

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private java.math.BigDecimal price;

    // ── Constructors ────────────────────────────────────────────────────────

    public PriceUpdateRequest() {}

    public PriceUpdateRequest(java.math.BigDecimal price) {
        this.price = price;
    }

    // ── Getters & Setters ───────────────────────────────────────────────────

    public java.math.BigDecimal getPrice() { return price; }
    public void setPrice(java.math.BigDecimal price) { this.price = price; }

    /**
     * Returns price as plain string — no scientific notation, no trailing zeros.
     * e.g. 75 → "75",  75.50 → "75.50"
     */
    public String getPriceAsString() {
        return price != null ? price.stripTrailingZeros().toPlainString() : null;
    }
}
