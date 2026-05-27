package com.cscs.digitalpricetag.controller;

import com.cscs.digitalpricetag.dto.ApiResponse;
import com.cscs.digitalpricetag.dto.api.PagedResponse;
import com.cscs.digitalpricetag.dto.api.StoreResponse;
import com.cscs.digitalpricetag.dto.api.StoreCreateRequest;
import com.cscs.digitalpricetag.dto.api.StoreUpdateRequest;
import com.cscs.digitalpricetag.service.StoreService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/stores")
@PreAuthorize("hasAuthority('store')")
public class StoreController {

    private final StoreService storeService;

    public StoreController(StoreService storeService) {
        this.storeService = storeService;
    }

    /**
     * GET /api/stores/all
     * Returns a flat list of ALL stores for the merchant (no pagination).
     * Uses Dragon ESL: GET /zk/store/getAllStoresByMerchant
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<java.util.List<StoreResponse>>> getAllStores() {
        java.util.List<StoreResponse> stores = storeService.getAllStores();
        return ResponseEntity.ok(ApiResponse.success("All stores fetched successfully", stores));
    }

    /**
     * GET /api/stores?page=0&size=10&search=main
     * Protected — requires: Authorization: Bearer <jwt>
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<StoreResponse>>> getStores(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        PagedResponse<StoreResponse> stores = storeService.getStores(page, size, search);
        return ResponseEntity.ok(ApiResponse.success("Stores fetched successfully", stores));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StoreResponse>> addStore(@RequestBody StoreCreateRequest request) {
        StoreResponse store = storeService.addStore(request);
        return ResponseEntity.ok(ApiResponse.success("Store added successfully", store));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StoreResponse>> updateStore(@PathVariable String id, @RequestBody StoreUpdateRequest request) {
        StoreResponse store = storeService.updateStore(id, request);
        return ResponseEntity.ok(ApiResponse.success("Store updated successfully", store));
    }

    @PutMapping("/{id}/disable")
    public ResponseEntity<ApiResponse<Void>> disableStore(@PathVariable String id) {
        storeService.disableStore(id);
        return ResponseEntity.ok(ApiResponse.success("Store disabled successfully", null));
    }

    @PutMapping("/{id}/enable")
    public ResponseEntity<ApiResponse<Void>> enableStore(@PathVariable String id) {
        storeService.enableStore(id);
        return ResponseEntity.ok(ApiResponse.success("Store enabled successfully", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStore(@PathVariable String id) {
        storeService.deleteStore(id);
        return ResponseEntity.ok(ApiResponse.success("Store deleted successfully", null));
    }

    /**
     * GET /api/stores/merchant-info
     * Returns real merchant info from Dragon ESL /zk/merchant/getMerchantInfo
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/merchant-info")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getMerchantInfo() {
        java.util.Map<String, Object> info = storeService.getMerchantInfo();
        return ResponseEntity.ok(ApiResponse.success("Merchant info fetched successfully", info));
    }

    /**
     * GET /api/stores/active-count
     * Returns count of active stores from Dragon ESL
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/active-count")
    public ResponseEntity<ApiResponse<Long>> getActiveStoreCount() {
        long count = storeService.getActiveStoreCount();
        return ResponseEntity.ok(ApiResponse.success("Active store count fetched successfully", count));
    }
}

