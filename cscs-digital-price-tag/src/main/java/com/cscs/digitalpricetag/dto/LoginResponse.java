package com.cscs.digitalpricetag.dto;

import java.util.List;

public class LoginResponse {

    private String token;
    private String username;
    private String role;
    private long expirationMs;
    private List<String> permissions;

    public LoginResponse() {}

    public LoginResponse(String token, String username, String role, long expirationMs, List<String> permissions) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.expirationMs = expirationMs;
        this.permissions = permissions;
    }

    public String getToken() { return token; }
    public String getUsername() { return username; }
    public String getRole() { return role; }
    public long getExpirationMs() { return expirationMs; }
    public List<String> getPermissions() { return permissions; }
    public void setToken(String token) { this.token = token; }
    public void setUsername(String username) { this.username = username; }
    public void setRole(String role) { this.role = role; }
    public void setExpirationMs(long expirationMs) { this.expirationMs = expirationMs; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }
}
