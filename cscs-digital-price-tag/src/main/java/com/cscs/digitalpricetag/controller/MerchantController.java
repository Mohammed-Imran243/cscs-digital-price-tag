package com.cscs.digitalpricetag.controller;

import com.cscs.digitalpricetag.dto.ApiResponse;
import com.cscs.digitalpricetag.service.MerchantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Map;

@RestController
@RequestMapping("/merchant")
@PreAuthorize("isAuthenticated()")
public class MerchantController {

    private final MerchantService merchantService;

    public MerchantController(MerchantService merchantService) {
        this.merchantService = merchantService;
    }

    @GetMapping("/info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMerchantInfo() {
        Map<String, Object> info = merchantService.getMerchantInfo();
        return ResponseEntity.ok(ApiResponse.success("Merchant info fetched successfully", info));
    }

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMerchantSettings() {
        Map<String, Object> settings = merchantService.getMerchantSettings();
        return ResponseEntity.ok(ApiResponse.success("Merchant settings fetched successfully", settings));
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<Void>> updateMerchantSettings(@RequestBody Map<String, Object> requestBody) {
        merchantService.updateMerchantSettings(requestBody);
        return ResponseEntity.ok(ApiResponse.success("Merchant settings updated successfully", null));
    }
}
