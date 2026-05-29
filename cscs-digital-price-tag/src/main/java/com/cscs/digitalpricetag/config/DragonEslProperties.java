package com.cscs.digitalpricetag.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Externalized Dragon ESL API configuration.
 * All values are bound from application.yml under the "dragon.esl" prefix.
 */
@Component
@ConfigurationProperties(prefix = "dragon.esl")
public class DragonEslProperties {

    private String baseUrl;
    private int connectTimeoutMs = 10000;
    private int readTimeoutMs    = 30000;

    // Dragon ESL login credentials (set via env vars in production)
    private String username;
    private String password;

    // API paths
    private String publicKeyPath = "/zk/user/getErpPublicKey";
    private String loginPath     = "/zk/user/login";
    private Long merchantId;

    // ----------------------------------------------------------------
    // Getters & Setters (no Lombok on config classes — Spring needs them)
    // ----------------------------------------------------------------

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    public int getConnectTimeoutMs() { return connectTimeoutMs; }
    public void setConnectTimeoutMs(int connectTimeoutMs) { this.connectTimeoutMs = connectTimeoutMs; }

    public int getReadTimeoutMs() { return readTimeoutMs; }
    public void setReadTimeoutMs(int readTimeoutMs) { this.readTimeoutMs = readTimeoutMs; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPublicKeyPath() { return publicKeyPath; }
    public void setPublicKeyPath(String publicKeyPath) { this.publicKeyPath = publicKeyPath; }

    public String getLoginPath() { return loginPath; }
    public void setLoginPath(String loginPath) { this.loginPath = loginPath; }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }
}
