package com.cscs.digitalpricetag.service.base;

import com.cscs.digitalpricetag.dto.dragon.DragonTemplateGenericResponse;
import com.cscs.digitalpricetag.exception.DragonEslException;
import com.cscs.digitalpricetag.service.DragonEslApiClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

import java.util.HashMap;
import java.util.Map;

public abstract class DragonEslServiceSupport {

    protected final Logger log = LoggerFactory.getLogger(getClass());
    protected final DragonEslApiClient dragonEslApiClient;

    protected DragonEslServiceSupport(DragonEslApiClient dragonEslApiClient) {
        this.dragonEslApiClient = dragonEslApiClient;
    }

    protected Object performGet(String url) {
        try {
            log.info("Performing GET request to: {}", url);
            DragonTemplateGenericResponse response = dragonEslApiClient.get(
                    url,
                    DragonTemplateGenericResponse.class
            );
            log.info("GET {} response - success: {}, code: {}, message: {}, data: {}", 
                    url, response != null ? response.isSuccess() : "null", 
                    response != null ? response.getCode() : "null", 
                    response != null ? response.getMessage() : "null",
                    response != null ? response.getData() : "null");
            if (response == null || !response.isSuccess()) {
                String msg = response != null ? response.getMessage() : "No response";
                throw new DragonEslException("GET failed: " + msg, HttpStatus.BAD_GATEWAY);
            }
            return response.getData() != null ? response.getData() : response;
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error on GET {}: {}", url, e.getMessage());
            throw new DragonEslException("GET request failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    protected Object performPost(String url, Map<String, Object> request) {
        try {
            log.info("Performing POST request to: {} with request: {}", url, request);
            DragonTemplateGenericResponse response = dragonEslApiClient.post(
                    url,
                    request != null ? request : new HashMap<>(),
                    DragonTemplateGenericResponse.class
            );
            log.info("POST {} response - success: {}, code: {}, message: {}, data: {}", 
                    url, response != null ? response.isSuccess() : "null", 
                    response != null ? response.getCode() : "null", 
                    response != null ? response.getMessage() : "null",
                    response != null ? response.getData() : "null");
            if (response == null || !response.isSuccess()) {
                String msg = response != null ? response.getMessage() : "No response";
                throw new DragonEslException("POST failed: " + msg, HttpStatus.BAD_GATEWAY);
            }
            return response.getData() != null ? response.getData() : response;
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error on POST {}: {}", url, e.getMessage());
            throw new DragonEslException("POST request failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    protected Object performPut(String url, Map<String, Object> request) {
        try {
            log.info("Performing PUT request to: {} with request: {}", url, request);
            DragonTemplateGenericResponse response = dragonEslApiClient.put(
                    url,
                    request != null ? request : new HashMap<>(),
                    DragonTemplateGenericResponse.class
            );
            log.info("PUT {} response - success: {}, code: {}, message: {}, data: {}", 
                    url, response != null ? response.isSuccess() : "null", 
                    response != null ? response.getCode() : "null", 
                    response != null ? response.getMessage() : "null",
                    response != null ? response.getData() : "null");
            if (response == null || !response.isSuccess()) {
                String msg = response != null ? response.getMessage() : "No response";
                throw new DragonEslException("PUT failed: " + msg, HttpStatus.BAD_GATEWAY);
            }
            return response.getData() != null ? response.getData() : response;
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error on PUT {}: {}", url, e.getMessage());
            throw new DragonEslException("PUT request failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }
}
