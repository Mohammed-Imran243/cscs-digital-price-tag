package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.dto.DragonLoginRequest;
import com.cscs.digitalpricetag.dto.DragonLoginResponse;
import com.cscs.digitalpricetag.exception.DragonEslException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import javax.crypto.Cipher;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Map;

@Service
public class DragonAuthService {

    private static final Logger log = LoggerFactory.getLogger(DragonAuthService.class);

    private final WebClient webClient;

    public DragonAuthService(@Qualifier("dragonEslAuthWebClient") WebClient webClient) {
        this.webClient = webClient;
    }

    /**
     * Fetch RSA public key from Dragon ESL.
     * VERIFIED endpoint: GET /zk/user/getErpPublicKey
     */
    public String fetchRsaPublicKey() {
        try {
            Map<?, ?> response = webClient.get()
                    .uri("/zk/user/getErpPublicKey")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null || !Integer.valueOf(10000).equals(response.get("code"))) {
                throw new DragonEslException("Failed to fetch RSA public key", HttpStatus.BAD_GATEWAY);
            }

            Object data = response.get("data");
            if (data instanceof String) {
                return (String) data;
            }

            throw new DragonEslException("RSA public key not found in response", HttpStatus.BAD_GATEWAY);

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching RSA public key: {}", e.getMessage());
            throw new DragonEslException("RSA key fetch failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    /**
     * Encrypt password using RSAES-PKCS1-V1_5.
     * VERIFIED: Dragon ESL requires PKCS1-V1_5, NOT OAEP.
     */
    public String encryptPassword(String password, String base64PublicKey) {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(base64PublicKey);
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(keyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            PublicKey publicKey = keyFactory.generatePublic(keySpec);

            // VERIFIED: RSAES-PKCS1-V1_5 — Dragon ESL requirement
            Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
            cipher.init(Cipher.ENCRYPT_MODE, publicKey);

            byte[] encrypted = cipher.doFinal(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);

        } catch (Exception e) {
            log.error("Password encryption failed: {}", e.getMessage());
            throw new DragonEslException("Password encryption failed: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Login to Dragon ESL.
     * VERIFIED:
     *   - POST /zk/user/login
     *   - loginType = 3 (mandatory for RSA-encrypted password)
     *   - loginPassword must be RSA-PKCS1-V1_5 encrypted and Base64-encoded
     */
    public String login(String username, String password) {
        try {
            // Step 1: Fetch RSA public key
            String rsaPublicKey = fetchRsaPublicKey();

            // Step 2: Encrypt password with PKCS1-V1_5
            String encryptedPassword = encryptPassword(password, rsaPublicKey);

            // Step 3: Build verified login request (loginType=3 is mandatory)
            DragonLoginRequest loginRequest = new DragonLoginRequest(username, encryptedPassword);

            // Step 4: POST to Dragon ESL
            DragonLoginResponse response = webClient.post()
                    .uri("/zk/user/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(loginRequest)
                    .retrieve()
                    .bodyToMono(DragonLoginResponse.class)
                    .block();

            if (response == null || !response.isSuccess()) {
                String msg = response != null ? response.getMsg() : "No response from Dragon ESL";
                throw new DragonEslException("Dragon ESL login failed: " + msg, HttpStatus.UNAUTHORIZED);
            }

            String dragonToken = response.getData().getToken();
            log.info("Dragon ESL login API call successful for user: {}", username);
            
            return dragonToken;

        } catch (DragonEslException e) {
            log.error("Dragon ESL login error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Dragon ESL login error: {}", e.getMessage());
            throw new DragonEslException("Dragon ESL login failed: " + e.getMessage(), HttpStatus.UNAUTHORIZED);
        }
    }
}