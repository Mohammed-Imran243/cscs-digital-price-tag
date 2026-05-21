package com.cscs.digitalpricetag.dto.dragon;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DragonStoreResponse {

    private Integer code;
    private String message;
    private DragonStoreListResponse.DragonStoreItem data;
    private boolean success;

    public Integer getCode() { return code; }
    public void setCode(Integer code) { this.code = code; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public DragonStoreListResponse.DragonStoreItem getData() { return data; }
    public void setData(DragonStoreListResponse.DragonStoreItem data) { this.data = data; }

    public boolean isSuccess() { return success && (code != null && (code == 10000 || code == 14010 || code == 14012 || code == 200)); }
    public void setSuccess(boolean success) { this.success = success; }
}
