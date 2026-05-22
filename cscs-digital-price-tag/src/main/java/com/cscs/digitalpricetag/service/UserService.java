package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.dto.dragon.DragonTemplateGenericResponse;
import com.cscs.digitalpricetag.exception.DragonEslException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private final DragonEslApiClient dragonEslApiClient;
    private final DragonAuthService dragonAuthService;

    public UserService(DragonEslApiClient dragonEslApiClient, DragonAuthService dragonAuthService) {
        this.dragonEslApiClient = dragonEslApiClient;
        this.dragonAuthService = dragonAuthService;
    }

    public Object listUsers(int pageNum, int pageSize) {
        Map<String, Object> body = new HashMap<>();
        body.put("pageNum", pageNum);
        body.put("pageSize", pageSize);
        return performPost("/zk/user/findUserList", body);
    }

    public Object addUser(Map<String, Object> request) {
        try {
            return performPost("/zk/user/add", request);
        } catch (Exception e) {
            log.error("Failed to add user: {}", e.getMessage());
            throw new DragonEslException("Failed to add user: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    public Object updateUser(Map<String, Object> request) {
        return performPost("/zk/user/updateUser", request);
    }

    public Object deleteUser(String id) {
        try {
            DragonTemplateGenericResponse response = dragonEslApiClient.delete(
                    "/zk/user/delete/" + id,
                    null,
                    DragonTemplateGenericResponse.class
            );
            if (response == null || !response.isSuccess()) {
                String msg = response != null ? response.getMessage() : "No response";
                throw new DragonEslException("DELETE failed: " + msg, HttpStatus.BAD_GATEWAY);
            }
            return response.getData() != null ? response.getData() : response;
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error on DELETE user: {}", e.getMessage());
            throw new DragonEslException("DELETE request failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    private Object performPost(String url, Map<String, Object> request) {
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
}

