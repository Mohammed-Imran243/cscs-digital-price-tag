package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.dto.api.AuditLogResponse;
import com.cscs.digitalpricetag.dto.api.PagedResponse;
import com.cscs.digitalpricetag.dto.dragon.DragonLogListResponse;
import com.cscs.digitalpricetag.dto.dragon.DragonLogRequest;
import com.cscs.digitalpricetag.exception.DragonEslException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);
    private final DragonEslApiClient dragonEslApiClient;

    public AuditLogService(DragonEslApiClient dragonEslApiClient) {
        this.dragonEslApiClient = dragonEslApiClient;
    }

    public PagedResponse<AuditLogResponse> getAuditLogs(
            String storeId,
            String startDate,
            String endDate,
            int page,
            int size,
            Integer operation) {

        try {
            // 1. Construct DragonLogRequest filter body
            DragonLogRequest requestBody = new DragonLogRequest();
            if (storeId != null && !storeId.isBlank()) {
                requestBody.setStoreId(Long.parseLong(storeId.trim()));
            }

            // ZKong createdTime expects a comma-separated date range: "YYYY-MM-DD 00:00:00,YYYY-MM-DD 23:59:59"
            if (startDate != null && endDate != null && !startDate.isBlank() && !endDate.isBlank()) {
                requestBody.setCreatedTime(startDate.trim() + " 00:00:00," + endDate.trim() + " 23:59:59");
            }

            if (operation != null) {
                requestBody.setOperation(operation);
            }

            // 2. Query ZKong Cloud POST API
            String url = String.format("/zk/erp/log/listLog?page=%d&size=%d", page, size);
            log.info("Querying Dragon ESL log/listLog: URL={}, storeId={}, operation={}, dateRange={}", 
                    url, requestBody.getStoreId(), requestBody.getOperation(), requestBody.getCreatedTime());

            DragonLogListResponse response = dragonEslApiClient.post(url, requestBody, DragonLogListResponse.class);

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for log history", HttpStatus.BAD_GATEWAY);
            }

            if (!response.isSuccess()) {
                throw new DragonEslException("Failed to fetch log history: " + response.getMsg(), HttpStatus.BAD_GATEWAY);
            }

            // 3. Map ZKong log items to API AuditLogResponse DTOs
            List<AuditLogResponse> mappedLogs = new ArrayList<>();
            long totalElements = 0;

            if (response.getData() != null) {
                totalElements = response.getData().getTotal();
                List<DragonLogListResponse.DragonLogItem> items = response.getData().getList();
                if (items != null) {
                    mappedLogs = items.stream()
                            .map(this::mapToAuditLogResponse)
                            .collect(Collectors.toList());
                }
            }

            return new PagedResponse<>(mappedLogs, page, size, totalElements);

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error retrieving audit logs: {}", e.getMessage(), e);
            throw new DragonEslException("Audit logs retrieval failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    private AuditLogResponse mapToAuditLogResponse(DragonLogListResponse.DragonLogItem item) {
        AuditLogResponse dto = new AuditLogResponse();
        dto.setId(item.getId());
        dto.setItemBarCode(item.getItemBarCode());
        dto.setItemName(item.getItemName());
        dto.setPrice(item.getPrice());
        dto.setPriceTagBarCode(item.getPriceTagBarCode());
        dto.setModel(item.getModel());
        dto.setOperator(item.getOperator() != null ? item.getOperator() : "System");
        dto.setPushTime(item.getPushTime());
        dto.setFeedbackTime(item.getFeedbackTime());
        dto.setCreatedTime(item.getCreatedTime());
        
        dto.setOperation(item.getOperation());
        dto.setOperationText(getOperationText(item.getOperation()));
        
        dto.setStatus(item.getStatus());
        dto.setStatusText(getStatusText(item.getStatus()));
        
        return dto;
    }

    private String getOperationText(Integer operation) {
        if (operation == null) return "System Action";
        switch (operation) {
            case 1: return "Bind Tag";
            case 2: return "Unbind Tag";
            case 3: return "Force Refresh";
            case 4: return "Product Change";
            case 5: return "Template Change";
            case 13: return "Force LED Flash";
            case 14: return "Smart Reissue";
            default: return "System Action (" + operation + ")";
        }
    }

    private String getStatusText(Integer status) {
        if (status == null) return "Unknown";
        switch (status) {
            case 2:
            case 14:
                return "Success";
            case 7:
                return "In Progress";
            case 3:
                return "Failed";
            default:
                return "Failed (" + status + ")";
        }
    }
}
