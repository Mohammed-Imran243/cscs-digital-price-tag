package com.cscs.digitalpricetag.dto.api;

public class LoginResponse {

    private String token;
    private String username;
    private String role;
    private long expiresIn;
    private java.util.List<String> permissions;

    // ── Constructors ────────────────────────────────────────────────────────

    public LoginResponse() {}

    public LoginResponse(String token, String username, String role, long expiresIn) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.expiresIn = expiresIn;
        this.permissions = new java.util.ArrayList<>();
    }

    public LoginResponse(String token, String username, String role, long expiresIn, java.util.List<String> permissions) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.expiresIn = expiresIn;
        this.permissions = permissions;
    }

    // ── Getters & Setters ───────────────────────────────────────────────────

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public java.util.List<String> getPermissions() {
        return permissions;
    }

    public void setPermissions(java.util.List<String> permissions) {
        this.permissions = permissions;
    }
}
