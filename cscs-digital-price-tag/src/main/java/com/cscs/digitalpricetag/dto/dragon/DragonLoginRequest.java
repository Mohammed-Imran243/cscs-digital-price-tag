package com.cscs.digitalpricetag.dto.dragon;

import com.fasterxml.jackson.annotation.JsonProperty;

public class DragonLoginRequest {

    @JsonProperty("account")
    private String loginName;

    @JsonProperty("password")
    private String loginPassword;

    @JsonProperty("loginType")
    private int loginType;

    public DragonLoginRequest() {
        this.loginType = 3; // VERIFIED: always 3 for RSA-encrypted password login
    }

    public DragonLoginRequest(String loginName, String loginPassword) {
        this.loginName = loginName;
        this.loginPassword = loginPassword;
        this.loginType = 3;
    }

    public String getLoginName() { return loginName; }
    public void setLoginName(String loginName) { this.loginName = loginName; }

    public String getLoginPassword() { return loginPassword; }
    public void setLoginPassword(String loginPassword) { this.loginPassword = loginPassword; }

    public int getLoginType() { return loginType; }
    public void setLoginType(int loginType) { this.loginType = loginType; }
}


