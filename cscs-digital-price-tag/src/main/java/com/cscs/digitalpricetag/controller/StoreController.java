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

import com.cscs.digitalpricetag.service.ImportExportService;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import com.cscs.digitalpricetag.dto.ImportResponse;
import java.io.IOException;

@RestController
@RequestMapping("/stores")
@PreAuthorize("hasAuthority('store')")
public class StoreController {

    private final StoreService storeService;
    private final ImportExportService importExportService;

    public StoreController(StoreService storeService, ImportExportService importExportService) {
        this.storeService = storeService;
        this.importExportService = importExportService;
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

    @PreAuthorize("isAuthenticated()")
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportResponse> importStores(@RequestParam("file") MultipartFile file) {
        ImportResponse response = importExportService.importStores(file);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportStores() throws IOException {
        byte[] excelData = importExportService.exportStores();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=stores.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelData);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/import-template")
    public ResponseEntity<byte[]> getImportTemplate() throws IOException {
        byte[] templateData = importExportService.getStoreImportTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=store_import_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(templateData);
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

