package com.cscs.digitalpricetag.dto.dragon;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DragonTemplateGenericResponse {

    private Integer code;
    private String message;
    private Object data;
    private boolean success;

    public Integer getCode() { return code; }
    public void setCode(Integer code) { this.code = code; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Object getData() { return data; }
    public void setData(Object data) { this.data = data; }

    public boolean isSuccess() { return (success) || (code != null && ((code >= 10000 && code < 11000) || code == 200 || code == 12003)); }
    public void setSuccess(boolean success) { this.success = success; }
}


