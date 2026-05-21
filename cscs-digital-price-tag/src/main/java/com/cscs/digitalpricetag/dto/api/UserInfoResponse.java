package com.cscs.digitalpricetag.dto.api;

public class UserInfoResponse {

    private String username;
    private boolean authenticated;

    // ── Constructors ────────────────────────────────────────────────────────

    public UserInfoResponse() {}

    public UserInfoResponse(String username, boolean authenticated) {
        this.username = username;
        this.authenticated = authenticated;
    }

    // ── Getters & Setters ───────────────────────────────────────────────────

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public boolean isAuthenticated() { return authenticated; }
    public void setAuthenticated(boolean authenticated) { this.authenticated = authenticated; }
}
