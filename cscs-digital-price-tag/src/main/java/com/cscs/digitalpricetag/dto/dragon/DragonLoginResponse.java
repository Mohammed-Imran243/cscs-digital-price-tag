package com.cscs.digitalpricetag.dto.dragon;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response DTO for Dragon ESL POST /zk/user/login
 *
 * Dragon ESL returns:
 * {
 *   "code": 200,
 *   "msg": "success",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiJ9...",
 *     "loginName": "admin",
 *     "userName": "Administrator"
 *   }
 * }
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class DragonLoginResponse {

    @JsonProperty("code")
    private Integer code;

    @JsonProperty("msg")
    private String msg;

    @JsonProperty("data")
    private DragonLoginData data;

    public Integer         getCode() { return code; }
    public void            setCode(Integer code) { this.code = code; }

    public String          getMsg()  { return msg; }
    public void            setMsg(String msg) { this.msg = msg; }

    public DragonLoginData getData() { return data; }
    public void            setData(DragonLoginData data) { this.data = data; }

    public boolean isSuccess() {
        return code != null && code == 14014 && data != null && data.getToken() != null;
    }

    // ----------------------------------------------------------------
    // Nested data object
    // ----------------------------------------------------------------

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DragonLoginData {

        @JsonProperty("token")
        private String token;

        @JsonProperty("loginName")
        private String loginName;

        @JsonProperty("userName")
        private String userName;

        public String getToken()     { return token; }
        public void   setToken(String token) { this.token = token; }

        public String getLoginName() { return loginName; }
        public void   setLoginName(String loginName) { this.loginName = loginName; }

        public String getUserName()  { return userName; }
        public void   setUserName(String userName) { this.userName = userName; }
    }
}


