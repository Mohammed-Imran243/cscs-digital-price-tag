package com.cscs.digitalpricetag.dto.api;

import jakarta.validation.constraints.NotBlank;

public class ApCreateRequest {

    @NotBlank(message = "Store ID is required")
    private String storeId;

    private String apName;

    @NotBlank(message = "MAC address is required")
    private String mac;

    private String comment;

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public String getApName() { return apName; }
    public void setApName(String apName) { this.apName = apName; }

    public String getMac() { return mac; }
    public void setMac(String mac) { this.mac = mac; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
