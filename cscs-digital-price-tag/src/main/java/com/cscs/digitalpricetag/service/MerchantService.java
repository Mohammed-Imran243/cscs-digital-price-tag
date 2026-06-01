package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.exception.DragonEslException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MerchantService {
    private static final Logger log = LoggerFactory.getLogger(MerchantService.class);
    private final DragonEslApiClient dragonEslApiClient;

    private static final long MERCHANT_ID = 1775639851383L;
    private static final String ACCOUNT_NUM = "0008";

    public MerchantService(DragonEslApiClient dragonEslApiClient) {
        this.dragonEslApiClient = dragonEslApiClient;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getMerchantInfo() {
        try {
            Map<?, ?> response = dragonEslApiClient.get(
                    "/zk/merchant/get?merchantId=" + MERCHANT_ID + "&accountNum=" + ACCOUNT_NUM,
                    Map.class
            );

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for merchant info", HttpStatus.BAD_GATEWAY);
            }

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to fetch merchant info: " + msg, HttpStatus.BAD_GATEWAY);
            }

            Object data = response.get("data");
            if (data instanceof Map) {
                return (Map<String, Object>) data;
            }
            return Collections.emptyMap();
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching merchant info: {}", e.getMessage());
            throw new DragonEslException("Merchant info fetch failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getMerchantSettings() {
        try {
            Map<?, ?> response = dragonEslApiClient.get(
                    "/zk/merchant/getMerchant?merchantId=" + MERCHANT_ID,
                    Map.class
            );

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for merchant settings", HttpStatus.BAD_GATEWAY);
            }

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to fetch merchant settings: " + msg, HttpStatus.BAD_GATEWAY);
            }

            Object data = response.get("data");
            if (data instanceof Map) {
                return (Map<String, Object>) data;
            }
            return Collections.emptyMap();
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching merchant settings: {}", e.getMessage());
            throw new DragonEslException("Merchant settings fetch failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    @SuppressWarnings("unchecked")
    public void updateMerchantSettings(Map<String, Object> requestBody) {
        try {
            // Prepare payload
            Map<String, Object> body = new HashMap<>();
            body.put("merchantId", MERCHANT_ID);
            body.put("merchantName", requestBody.get("merchantName"));
            body.put("passwordExpiryTime", requestBody.get("passwordExpiryTime"));
            body.put("passwordWarmingDay", requestBody.get("passwordWarmingDay"));

            log.info("Updating merchant settings with payload: {}", body);

            Map<?, ?> response = dragonEslApiClient.post(
                    "/zk/merchant/saveMerchant",
                    body,
                    Map.class
            );

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for updating settings", HttpStatus.BAD_GATEWAY);
            }

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to update merchant settings: " + msg, HttpStatus.BAD_GATEWAY);
            }
            log.info("Merchant settings updated successfully: {}", response);
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating merchant settings: {}", e.getMessage());
            throw new DragonEslException("Merchant settings update failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }
}
