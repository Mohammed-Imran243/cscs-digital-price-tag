package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.dto.dragon.DragonStoreListResponse;
import com.cscs.digitalpricetag.dto.api.PagedResponse;
import com.cscs.digitalpricetag.dto.api.StoreResponse;
import com.cscs.digitalpricetag.exception.DragonEslException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import com.cscs.digitalpricetag.dto.api.StoreCreateRequest;
import com.cscs.digitalpricetag.dto.api.StoreUpdateRequest;
import com.cscs.digitalpricetag.dto.dragon.DragonStoreResponse;

@Service
public class StoreService {

    private static final Logger log = LoggerFactory.getLogger(StoreService.class);

    private final DragonEslApiClient dragonEslApiClient;

    public StoreService(DragonEslApiClient dragonEslApiClient) {
        this.dragonEslApiClient = dragonEslApiClient;
    }

    /**
     * Fetch ALL stores for the merchant (flat list, no pagination).
     *
     * VERIFIED endpoint from ESL API doc (Section 6.3):
     *   GET /zk/store/storeList
     *
     * Returns a flat list of all stores that the current user has permission for.
     */
    @SuppressWarnings("unchecked")
    public List<StoreResponse> getAllStores() {
        try {
            Map<?, ?> response = dragonEslApiClient.get(
                    "/zk/store/storeList",
                    Map.class
            );

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL", HttpStatus.BAD_GATEWAY);
            }

            // Check success — Zkong uses "success" boolean or code 10000/200
            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to fetch all stores: " + msg, HttpStatus.BAD_GATEWAY);
            }

            Object data = response.get("data");
            if (data instanceof List) {
                List<Map<String, Object>> storeList = (List<Map<String, Object>>) data;
                return storeList.stream()
                        .map(this::mapFromRawMap)
                        .collect(Collectors.toList());
            }

            log.warn("getAllStores: unexpected data type: {}", data != null ? data.getClass() : "null");
            return Collections.emptyList();

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching all stores: {}", e.getMessage());
            throw new DragonEslException("Store fetch failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    /**
     * Fetch stores from Dragon ESL with local pagination.
     * Uses GET /zk/store/storeList to fetch all stores and performs local filtering & pagination.
     */
    public PagedResponse<StoreResponse> getStores(int page, int size, String search) {
        try {
            List<StoreResponse> stores = getAllStores();

            // Apply search filter locally
            if (search != null && !search.isBlank()) {
                final String searchLower = search.toLowerCase();
                stores = stores.stream()
                        .filter(item -> (item.getStoreName() != null && item.getStoreName().toLowerCase().contains(searchLower))
                                || (item.getAddress() != null && item.getAddress().toLowerCase().contains(searchLower))
                                || (item.getExternalStoreId() != null && item.getExternalStoreId().toLowerCase().contains(searchLower)))
                        .collect(Collectors.toList());
            }

            // Paginate locally
            int totalElements = stores.size();
            int start = page * size;
            int end = Math.min(start + size, totalElements);

            List<StoreResponse> paginatedList = Collections.emptyList();
            if (start < totalElements) {
                paginatedList = stores.subList(start, end);
            }

            return new PagedResponse<>(paginatedList, page, size, (long) totalElements);

        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching stores: {}", e.getMessage());
            throw new DragonEslException("Store fetch failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    public StoreResponse addStore(StoreCreateRequest request) {
        try {
            DragonStoreResponse response = dragonEslApiClient.post(
                    "/zk/store/add",
                    request,
                    DragonStoreResponse.class
            );

            if (response == null || !response.isSuccess()) {
                String msg = response != null ? response.getMessage() : "No response";
                throw new DragonEslException("Failed to add store: " + msg, HttpStatus.BAD_GATEWAY);
            }

            return mapToStoreResponse(response.getData());
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error adding store: {}", e.getMessage());
            throw new DragonEslException("Store add failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    public StoreResponse updateStore(String id, StoreUpdateRequest request) {
        try {
            // 1. Find the store to get its current external store ID
            StoreResponse store = getAllStores().stream()
                    .filter(s -> id.equals(s.getId()) || id.equals(s.getStoreId()))
                    .findFirst()
                    .orElseThrow(() -> new DragonEslException("Store not found: " + id, HttpStatus.NOT_FOUND));

            String extId = store.getExternalStoreId() != null ? store.getExternalStoreId() : "";

            // 2. Prepare payload exactly as specified in Section 6.2
            Map<String, Object> body = new HashMap<>();
            body.put("needToUpdateExternalStoreId", (request.getNeedToUpdateExternalStoreId() != null && !request.getNeedToUpdateExternalStoreId().isEmpty()) ? request.getNeedToUpdateExternalStoreId() : extId);
            body.put("storeName", request.getStoreName() != null ? request.getStoreName() : store.getStoreName());
            body.put("externalStoreId", request.getExternalStoreId() != null ? request.getExternalStoreId() : extId);
            body.put("contacts", request.getContacts() != null ? request.getContacts() : store.getContacts());
            body.put("phone", request.getPhone() != null ? request.getPhone() : store.getPhone());
            body.put("mailbox", request.getMailbox() != null ? request.getMailbox() : store.getMailbox());
            body.put("address", request.getAddress() != null ? request.getAddress() : store.getAddress());
            body.put("comment", request.getComment() != null ? request.getComment() : "");

            if (store.getId() != null) {
                try {
                    body.put("id", Long.parseLong(store.getId().trim()));
                } catch (NumberFormatException e) {
                    body.put("id", store.getId());
                }
            }
            if (store.getStoreId() != null) {
                try {
                    body.put("storeId", Long.parseLong(store.getStoreId().trim()));
                } catch (NumberFormatException e) {
                    body.put("storeId", store.getStoreId());
                }
            }

            DragonStoreResponse response = dragonEslApiClient.post(
                    "/zk/store/update",
                    body,
                    DragonStoreResponse.class
            );

            if (response == null || !response.isSuccess()) {
                String msg = response != null ? response.getMessage() : "No response";
                throw new DragonEslException("Failed to update store: " + msg, HttpStatus.BAD_GATEWAY);
            }

            return mapToStoreResponse(response.getData());
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating store: {}", e.getMessage());
            throw new DragonEslException("Store update failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    public void disableStore(String id) {
        try {
            // Find store to get Zkong database primary key (id)
            StoreResponse store = getAllStores().stream()
                    .filter(s -> id.equals(s.getId()) || id.equals(s.getStoreId()))
                    .findFirst()
                    .orElseThrow(() -> new DragonEslException("Store not found: " + id, HttpStatus.NOT_FOUND));

            if (store.getId() == null) {
                throw new DragonEslException("Store must have a database ID to be disabled", HttpStatus.BAD_REQUEST);
            }

            Map<?, ?> response = dragonEslApiClient.put(
                    "/zk/store/disable/" + store.getId(),
                    Map.class
            );

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for disable", HttpStatus.BAD_GATEWAY);
            }

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to disable store: " + msg, HttpStatus.BAD_GATEWAY);
            }
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error disabling store: {}", e.getMessage());
            throw new DragonEslException("Store disable failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    public void enableStore(String id) {
        try {
            // Find store to get Zkong database primary key (id)
            StoreResponse store = getAllStores().stream()
                    .filter(s -> id.equals(s.getId()) || id.equals(s.getStoreId()))
                    .findFirst()
                    .orElseThrow(() -> new DragonEslException("Store not found: " + id, HttpStatus.NOT_FOUND));

            if (store.getId() == null) {
                throw new DragonEslException("Store must have a database ID to be enabled", HttpStatus.BAD_REQUEST);
            }

            Map<?, ?> response = dragonEslApiClient.put(
                    "/zk/store/enable/" + store.getId(),
                    Map.class
            );

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for enable", HttpStatus.BAD_GATEWAY);
            }

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to enable store: " + msg, HttpStatus.BAD_GATEWAY);
            }
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error enabling store: {}", e.getMessage());
            throw new DragonEslException("Store enable failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    public void deleteStore(String id) {
        try {
            // Find store to get Zkong database primary key (id)
            StoreResponse store = getAllStores().stream()
                    .filter(s -> id.equals(s.getId()) || id.equals(s.getStoreId()))
                    .findFirst()
                    .orElseThrow(() -> new DragonEslException("Store not found: " + id, HttpStatus.NOT_FOUND));

            if (store.getId() == null) {
                throw new DragonEslException("Store must have a database ID to be deleted", HttpStatus.BAD_REQUEST);
            }

            Map<?, ?> response = dragonEslApiClient.post(
                    "/zk/store/delete/" + store.getId(),
                    new HashMap<>(), // empty body
                    Map.class
            );

            if (response == null) {
                throw new DragonEslException("No response from Dragon ESL for delete", HttpStatus.BAD_GATEWAY);
            }

            Object successObj = response.get("success");
            boolean success = Boolean.TRUE.equals(successObj);
            Object codeObj = response.get("code");
            boolean codeOk = codeObj != null && (Integer.valueOf(10000).equals(codeObj) || Integer.valueOf(200).equals(codeObj));

            if (!success && !codeOk) {
                String msg = response.get("message") != null ? response.get("message").toString() : "Unknown error";
                throw new DragonEslException("Failed to delete store: " + msg, HttpStatus.BAD_GATEWAY);
            }
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting store: {}", e.getMessage());
            throw new DragonEslException("Store delete failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private StoreResponse mapToStoreResponse(DragonStoreListResponse.DragonStoreItem item) {
        if (item == null) return null;
        StoreResponse r = new StoreResponse();
        r.setId(item.getId());
        r.setStoreId(item.getStoreId() != null ? item.getStoreId().toString() : item.getId());
        r.setStoreName(item.getStoreName());
        r.setAddress(item.getAddress());
        r.setStatus(Integer.valueOf(1).equals(item.getStatus()) ? "ACTIVE" : "INACTIVE");
        r.setExternalStoreId(item.getExternalStoreId());
        r.setContacts(item.getContacts());
        r.setPhone(item.getPhone());
        r.setMailbox(item.getMailbox());
        r.setMerchantName(item.getMerchantName());
        return r;
    }

    /**
     * Maps from the raw Map returned by getAllStoresByMerchant.
     * The response is a flat list of maps, not the paginated DragonStoreItem format.
     */
    @SuppressWarnings("unchecked")
    private StoreResponse mapFromRawMap(Map<String, Object> raw) {
        StoreResponse r = new StoreResponse();
        r.setId(raw.get("id") != null ? raw.get("id").toString() : null);
        r.setStoreId(raw.get("storeId") != null ? raw.get("storeId").toString() : (raw.get("id") != null ? raw.get("id").toString() : null));
        r.setStoreName(raw.get("storeName") != null ? raw.get("storeName").toString() : null);
        r.setAddress(raw.get("address") != null ? raw.get("address").toString() : null);
        r.setExternalStoreId(raw.get("externalStoreId") != null ? raw.get("externalStoreId").toString() : null);
        r.setContacts(raw.get("contacts") != null ? raw.get("contacts").toString() : null);
        r.setPhone(raw.get("phone") != null ? raw.get("phone").toString() : null);
        r.setMailbox(raw.get("mailbox") != null ? raw.get("mailbox").toString() : null);
        r.setMerchantName(raw.get("merchantName") != null ? raw.get("merchantName").toString() : null);

        Object status = raw.get("status");
        if (status != null && Integer.valueOf(1).equals(status)) {
            r.setStatus("ACTIVE");
        } else {
            r.setStatus("INACTIVE");
        }

        return r;
    }
}

