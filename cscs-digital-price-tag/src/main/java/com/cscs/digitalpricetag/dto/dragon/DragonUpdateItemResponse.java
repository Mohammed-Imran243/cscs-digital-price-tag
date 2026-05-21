package com.cscs.digitalpricetag.dto.dragon;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Maps Dragon ESL response from:
 * PUT /zk/item/pcItem/{id}
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class DragonUpdateItemResponse {

    @JsonProperty("code")
    private Integer code;

    @JsonProperty("msg")
    private String msg;

    @JsonProperty("data")
    private Object data;

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Integer getCode() { return code; }
    public void setCode(Integer code) { this.code = code; }

    public String getMsg() { return msg; }
    public void setMsg(String msg) { this.msg = msg; }

    public Object getData() { return data; }
    public void setData(Object data) { this.data = data; }

    public boolean isSuccess() {
        return code != null && (code == 10000 || code == 200);
    }
}
