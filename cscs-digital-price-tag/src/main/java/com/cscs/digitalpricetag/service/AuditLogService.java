package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.dto.api.AuditLogResponse;
import com.cscs.digitalpricetag.dto.api.PagedResponse;
import com.cscs.digitalpricetag.dto.dragon.DragonLogListResponse;
import com.cscs.digitalpricetag.dto.dragon.DragonLogRequest;
import com.cscs.digitalpricetag.exception.DragonEslException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);
    private final DragonEslApiClient dragonEslApiClient;
    private final StoreService storeService;

    public AuditLogService(DragonEslApiClient dragonEslApiClient, StoreService storeService) {
        this.dragonEslApiClient = dragonEslApiClient;
        this.storeService = storeService;
    }

    public PagedResponse<AuditLogResponse> getPriceChangeLogs(
            String storeId,
            String startDate,
            String endDate,
            int page,
            int size) {

        try {
            List<Long> targetStoreIds = new ArrayList<>();
            if (storeId != null && !storeId.isBlank()) {
                try {
                    targetStoreIds.add(Long.parseLong(storeId.trim()));
                } catch (NumberFormatException e) {
                    // skip invalid storeId
                }
            } else {
                List<com.cscs.digitalpricetag.dto.api.StoreResponse> stores = storeService.getAllStores();
                if (stores != null) {
                    for (com.cscs.digitalpricetag.dto.api.StoreResponse s : stores) {
                        if (s.getStoreId() != null && !s.getStoreId().isBlank()) {
                            try {
                                targetStoreIds.add(Long.parseLong(s.getStoreId().trim()));
                            } catch (NumberFormatException e) {
                                // skip
                            }
                        }
                    }
                }
            }

            if (targetStoreIds.isEmpty()) {
                return new PagedResponse<>(Collections.emptyList(), page, size, 0L);
            }

            List<AuditLogResponse> mergedLogs = new ArrayList<>();
            long totalElementsAccumulator = 0;

            if (targetStoreIds.size() == 1) {
                long[] totalHolder = new long[1];
                List<AuditLogResponse> storeLogs = getMappedLogsForStore(targetStoreIds.get(0), startDate, endDate, page, size, totalHolder);
                mergedLogs.addAll(storeLogs);
                totalElementsAccumulator = totalHolder[0];
            } else {
                int targetSize = (page + 1) * size;
                for (Long tid : targetStoreIds) {
                    long[] totalHolder = new long[1];
                    List<AuditLogResponse> storeLogs = getMappedLogsForStore(tid, startDate, endDate, 0, targetSize, totalHolder);
                    mergedLogs.addAll(storeLogs);
                    totalElementsAccumulator += totalHolder[0];
                }

                // Sort merged list descending by feedbackTime (or createdTime, or id)
                mergedLogs.sort((a, b) -> {
                    String timeA = a.getCreatedTime() != null ? a.getCreatedTime() : (a.getPushTime() != null ? a.getPushTime() : "");
                    String timeB = b.getCreatedTime() != null ? b.getCreatedTime() : (b.getPushTime() != null ? b.getPushTime() : "");
                    int cmp = timeB.compareTo(timeA);
                    if (cmp != 0) return cmp;
                    return Long.compare(b.getId() != null ? b.getId() : 0L, a.getId() != null ? a.getId() : 0L);
                });

                // Slice list
                int start = page * size;
                int end = Math.min(start + size, mergedLogs.size());
                if (start < mergedLogs.size()) {
                    mergedLogs = new ArrayList<>(mergedLogs.subList(start, end));
                } else {
                    mergedLogs = Collections.emptyList();
                }
            }

            return new PagedResponse<>(mergedLogs, page, size, totalElementsAccumulator);

        } catch (Exception e) {
            log.error("Error retrieving price change logs: {}", e.getMessage(), e);
            throw new DragonEslException("Price change logs retrieval failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    private List<AuditLogResponse> getMappedLogsForStore(Long storeIdLong, String startDate, String endDate, int page, int size, long[] totalElementsHolder) {
        try {
            java.util.Map<String, Object> requestBody = new java.util.HashMap<>();
            requestBody.put("storeId", storeIdLong);

            if (startDate != null && endDate != null && !startDate.isBlank() && !endDate.isBlank()) {
                requestBody.put("createdTime", startDate.trim() + " 00:00:00," + endDate.trim() + " 23:59:59");
            } else {
                java.time.LocalDate today = java.time.LocalDate.now();
                java.time.LocalDate ninetyDaysAgo = today.minusDays(90);
                requestBody.put("createdTime", ninetyDaysAgo.toString() + " 00:00:00," + today.toString() + " 23:59:59");
            }

            requestBody.put("feedBackTimeOrder", "desc");

            String url = String.format("/zk/erp/log/listLog?page=%d&size=%d", page, size);
            log.info("Querying ZKong listLog for store {}: URL={}, body={}", storeIdLong, url, requestBody);

            java.util.Map response = dragonEslApiClient.post(url, requestBody, java.util.Map.class);
            if (response == null) {
                log.warn("No response from Dragon ESL for logs for store {}", storeIdLong);
                return Collections.emptyList();
            }

            Boolean success = (Boolean) response.get("success");
            if (success == null || !success) {
                log.warn("Failed to fetch logs for store {}: {}", storeIdLong, response.get("message"));
                return Collections.emptyList();
            }

            List<AuditLogResponse> mappedLogs = new java.util.ArrayList<>();
            java.util.Map data = (java.util.Map) response.get("data");
            if (data != null) {
                Object totalObj = data.get("totalElements");
                if (totalObj == null) {
                    totalObj = data.get("total");
                }
                if (totalObj instanceof Number) {
                    totalElementsHolder[0] = ((Number) totalObj).longValue();
                }

                List<java.util.Map> list = (List<java.util.Map>) data.get("list");
                if (list != null) {
                    for (java.util.Map item : list) {
                        AuditLogResponse dto = new AuditLogResponse();
                        
                        Object idVal = item.get("id");
                        if (idVal instanceof Number) {
                            dto.setId(((Number) idVal).longValue());
                        }
                        
                        dto.setItemBarCode((String) item.get("itemBarCode"));
                        dto.setItemName((String) item.get("itemName"));
                        
                        Object priceVal = item.get("price");
                        dto.setPrice(priceVal != null ? priceVal.toString() : null);
                        
                        dto.setPriceTagBarCode((String) item.get("priceTagBarCode"));
                        dto.setModel((String) item.get("model"));
                        dto.setOperator((String) item.get("operator"));
                        
                        Object pushTimeVal = item.get("pushTime");
                        dto.setPushTime(pushTimeVal != null ? pushTimeVal.toString() : null);
                        
                        Object feedbackTimeVal = item.get("feedbackTime");
                        dto.setFeedbackTime(feedbackTimeVal != null ? feedbackTimeVal.toString() : null);
                        
                        Object createdTimeVal = item.get("createdTime");
                        dto.setCreatedTime(createdTimeVal != null ? createdTimeVal.toString() : null);

                        Object storeIdVal = item.get("storeId");
                        dto.setStoreId(storeIdVal != null ? storeIdVal.toString() : null);

                        // Retrieve the product's original price to calculate the discount amount
                        String barcode = dto.getItemBarCode();
                        String logStoreId = dto.getStoreId() != null ? dto.getStoreId() : String.valueOf(storeIdLong);
                        String originalPrice = "0";
                        
                        if (barcode != null && !barcode.isBlank()) {
                            try {
                                java.util.Map<String, Object> queryBody = new java.util.HashMap<>();
                                try {
                                    queryBody.put("storeId", Long.parseLong(logStoreId));
                                } catch (NumberFormatException e) {
                                    queryBody.put("storeId", logStoreId);
                                }
                                queryBody.put("barCode", barcode);
                                queryBody.put("pcBarCode", barcode);
                                
                                java.util.Map<?, ?> prodResp = dragonEslApiClient.post(
                                    "/zk/item/list/1/0/1/" + logStoreId,
                                    queryBody,
                                    java.util.Map.class
                                );
                                
                                if (prodResp != null && Boolean.TRUE.equals(prodResp.get("success"))) {
                                    java.util.Map<?, ?> dataMap = (java.util.Map<?, ?>) prodResp.get("data");
                                    if (dataMap != null) {
                                        java.util.List<java.util.Map<String, Object>> prodList = (java.util.List<java.util.Map<String, Object>>) dataMap.get("list");
                                        if (prodList == null) {
                                            prodList = (java.util.List<java.util.Map<String, Object>>) dataMap.get("rows");
                                        }
                                        if (prodList != null && !prodList.isEmpty()) {
                                            java.util.Map<String, Object> rawProduct = prodList.get(0);
                                            Object origPriceVal = rawProduct.get("originalPrice");
                                            if (origPriceVal == null) {
                                                origPriceVal = rawProduct.get("custFeature2");
                                            }
                                            if (origPriceVal != null) {
                                                originalPrice = origPriceVal.toString();
                                            }
                                        }
                                    }
                                }
                            } catch (Exception e) {
                                log.warn("Failed to fetch originalPrice for barcode: " + barcode, e);
                            }
                        }
                        
                        dto.setOriginalPrice(originalPrice);
                        
                        // Calculate discountAmount = originalPrice - price
                        double price = 0.0;
                        double orig = 0.0;
                        try {
                            if (dto.getPrice() != null) price = Double.parseDouble(dto.getPrice());
                            if (originalPrice != null) orig = Double.parseDouble(originalPrice);
                        } catch (NumberFormatException e) {
                            // ignore
                        }
                        
                        double discount = Math.max(0.0, orig - price);
                        dto.setDiscountAmount(String.format("%.2f", discount));

                        Object opVal = item.get("operation");
                        Integer operation = null;
                        if (opVal instanceof Number) {
                            operation = ((Number) opVal).intValue();
                        }
                        dto.setOperation(operation);
                        
                        // Map operation label
                        String operationLabel = "Other";
                        if (operation != null) {
                            switch (operation) {
                                case 1: operationLabel = "Bind"; break;
                                case 2: operationLabel = "Unbind"; break;
                                case 3: operationLabel = "Force Refresh"; break;
                                case 4: operationLabel = "Product Change"; break;
                                case 5: operationLabel = "Template Change"; break;
                                case 13: operationLabel = "Import Bind"; break;
                                default: operationLabel = "Other"; break;
                            }
                        }
                        dto.setOperationLabel(operationLabel);
                        dto.setOperationText(operationLabel);

                        Object statusVal = item.get("status");
                        Integer status = null;
                        if (statusVal instanceof Number) {
                            status = ((Number) statusVal).intValue();
                        }
                        dto.setStatus(status);

                        // Map status label
                        String statusLabel = "Failed";
                        if (status != null) {
                            switch (status) {
                                case 2: statusLabel = "Success"; break;
                                case 3: statusLabel = "Failed - Timeout"; break;
                                case 9: statusLabel = "Failed - Tag Offline"; break;
                                case 10: statusLabel = "Failed - No AP"; break;
                                default: statusLabel = "Failed"; break;
                            }
                        }
                        dto.setStatusLabel(statusLabel);
                        dto.setStatusText(statusLabel);

                        mappedLogs.add(dto);
                    }
                }
            }
            return mappedLogs;
        } catch (Exception e) {
            log.error("Error retrieving price change logs for store {}: {}", storeIdLong, e.getMessage(), e);
            return Collections.emptyList();
        }
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

            // Temporarily fetch as String to log raw JSON, then deserialize
            String rawJsonResponse = dragonEslApiClient.post(url, requestBody, String.class);
            log.info("RAW ZKONG LOG RESPONSE: {}", rawJsonResponse);
            
            ObjectMapper mapper = new ObjectMapper();
            DragonLogListResponse response = mapper.readValue(rawJsonResponse, DragonLogListResponse.class);

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


