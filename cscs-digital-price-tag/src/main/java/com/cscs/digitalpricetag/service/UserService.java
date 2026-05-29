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
        // DragonEslException is thrown with the correct status by performPost — let it propagate
        return performPost("/zk/user/add", request);
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
                String msg = translateZKongMessage(response != null ? response.getMessage() : null);
                throw new DragonEslException(msg, HttpStatus.BAD_REQUEST);
            }
            return response.getData() != null ? response.getData() : response;
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error on DELETE user: {}", e.getMessage());
            throw new DragonEslException("Delete request failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
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

            if (response == null) {
                throw new DragonEslException("No response from ESL server", HttpStatus.BAD_GATEWAY);
            }
            if (!response.isSuccess()) {
                // ZKong returned a business error (e.g. "用户已存在") — return 400, not 502
                String translated = translateZKongMessage(response.getMessage());
                log.warn("ZKong business error on POST {}: {} -> {}", url, response.getMessage(), translated);
                throw new DragonEslException(translated, HttpStatus.BAD_REQUEST);
            }
            return response.getData() != null ? response.getData() : response;
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error on POST {}: {}", url, e.getMessage());
            throw new DragonEslException("Request failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    /**
     * Translates common ZKong Chinese error messages to English.
     * Falls back to the original message if no translation is found.
     */
    private String translateZKongMessage(String msg) {
        if (msg == null || msg.isBlank()) return "Operation failed";
        String lower = msg.toLowerCase();
        if (lower.contains("用户已存在") || lower.contains("already exist")) return "Account already exists. Please choose a different username.";
        if (lower.contains("用户不存在"))                                       return "User not found.";
        if (lower.contains("密码错误") || lower.contains("password"))          return "Incorrect password.";
        if (lower.contains("权限不足") || lower.contains("permission"))        return "Insufficient permissions.";
        if (lower.contains("角色不存在") || lower.contains("role"))            return "Role not found.";
        if (lower.contains("参数") || lower.contains("param"))                 return "Invalid request parameters.";
        if (lower.contains("token") || lower.contains("未登录"))               return "Session expired. Please log in again.";
        // Return original if no translation matched
        return msg;
    }
}
