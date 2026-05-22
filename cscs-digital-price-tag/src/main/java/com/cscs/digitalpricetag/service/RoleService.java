package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.dto.DragonTemplateGenericResponse;
import com.cscs.digitalpricetag.exception.DragonEslException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class RoleService {

    private static final Logger log = LoggerFactory.getLogger(RoleService.class);
    private final DragonEslApiClient dragonEslApiClient;

    public RoleService(DragonEslApiClient dragonEslApiClient) {
        this.dragonEslApiClient = dragonEslApiClient;
    }

    public Object getPermissions(String roleId) {
        // Fallback to roleId=3 as suggested in docs for getting full menu if none provided
        String id = (roleId != null && !roleId.isBlank()) ? roleId : "3";
        return performGet("/zk/role/queryOneRole?roleId=" + id);
    }

    public Object listRoles(int pageNum, int pageSize) {
        Map<String, Object> body = new HashMap<>();
        body.put("pageNum", pageNum);
        body.put("pageSize", pageSize);
        return performPost("/zk/role/queryRoleList", body);
    }

    public Object addRole(Map<String, Object> request) {
        return performPost("/zk/role/addRole", request);
    }

    public Object updateRole(String id, Map<String, Object> request) {
        // Ensure ID is in the payload for update
        request.put("id", id);
        return performPost("/zk/role/updateRole", request);
    }

    public Object deleteRole(String id) {
        return performPost("/zk/role/delRole?roleId=" + id, new HashMap<>());
    }

    private Object performGet(String url) {
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
