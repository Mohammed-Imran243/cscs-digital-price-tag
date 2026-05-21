package com.cscs.digitalpricetag.dto.dragon;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response DTO for Dragon ESL GET /zk/user/getErpPublicKey
 *
 * Dragon ESL returns a JSON envelope like:
 * {
 *   "code": 200,
 *   "msg": "success",
 *   "data": "MIIBIjANBgkq..."   <-- Base64-encoded DER public key
 * }
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class DragonPublicKeyResponse {

    @JsonProperty("code")
    private Integer code;

    @JsonProperty("msg")
    private String msg;

    @JsonProperty("data")
    private String publicKey;   // Base64-encoded RSA public key (DER / X.509 SubjectPublicKeyInfo)

    public Integer getCode()     { return code; }
    public void    setCode(Integer code) { this.code = code; }

    public String  getMsg()      { return msg; }
    public void    setMsg(String msg) { this.msg = msg; }

    public String  getPublicKey() { return publicKey; }
    public void    setPublicKey(String publicKey) { this.publicKey = publicKey; }

    public boolean isSuccess() {
        return code != null && (code == 10000 || code == 200);
    }
}
