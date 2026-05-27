package com.cscs.digitalpricetag.controller;

import com.cscs.digitalpricetag.dto.ApiResponse;
import com.cscs.digitalpricetag.dto.ApResponse;
import com.cscs.digitalpricetag.dto.api.EslResponse;
import com.cscs.digitalpricetag.dto.api.PagedResponse;
import com.cscs.digitalpricetag.service.DeviceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/devices")
@org.springframework.security.access.prepost.PreAuthorize("hasAuthority('equipment')")
public class DeviceController {

    private final DeviceService deviceService;

    public DeviceController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    /**
     * GET /api/devices/esl
     * Returns paginated ESL tags, optionally filtered by storeId and barcode/name search.
     */
    @GetMapping("/esl")
    public ResponseEntity<ApiResponse<PagedResponse<EslResponse>>> getEslDevices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String storeId,
            @RequestParam(required = false) String search) {

        PagedResponse<EslResponse> eslDevices = deviceService.getEslDevices(page, size, storeId, search);
        return ResponseEntity.ok(ApiResponse.success("ESL labels fetched successfully", eslDevices));
    }

    /**
     * GET /api/devices/ap
     * Returns paginated AP stations, optionally filtered by storeId and MAC/name search.
     */
    @GetMapping("/ap")
    public ResponseEntity<ApiResponse<PagedResponse<ApResponse>>> getApDevices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String storeId,
            @RequestParam(required = false) String search) {

        PagedResponse<ApResponse> apDevices = deviceService.getApDevices(page, size, storeId, search);
        return ResponseEntity.ok(ApiResponse.success("AP base stations fetched successfully", apDevices));
    }

    /**
     * POST /api/devices/ap/add
     * Adds a new AP device to DragonESL.
     * Matches DragonESL AP Management → Add popup fields:
     * Store Select (mandatory), Base Station Name, MAC (mandatory), Comment.
     */
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/ap/add")
    public ResponseEntity<ApiResponse<Void>> addAp(
            @RequestBody @Valid com.cscs.digitalpricetag.dto.api.ApCreateRequest request) {
        deviceService.addAp(request);
        return ResponseEntity.ok(ApiResponse.success("AP added successfully", null));
    }

    /**
     * POST /api/devices/esl/reboot
     * Reboots/forces refresh on a specific ESL tag by its barcode.
     */
    @PostMapping("/esl/reboot")
    public ResponseEntity<ApiResponse<Void>> rebootEsl(@RequestParam String barcode) {
        deviceService.rebootEsl(barcode);
        return ResponseEntity.ok(ApiResponse.success("ESL reboot command sent successfully", null));
    }

    /**
     * GET /api/devices/esl/detail
     * Fetches detailed information including bind image of an ESL tag by its barcode.
     */
    @GetMapping("/esl/detail")
    public ResponseEntity<ApiResponse<Object>> getEslDetail(@RequestParam String barcode) {
        Object detail = deviceService.getEslDetail(barcode);
        return ResponseEntity.ok(ApiResponse.success("ESL details fetched successfully", detail));
    }

    /**
     * POST /api/devices/esl/force-refresh
     * Triggers a forced refresh on a collection of ESL tags.
     */
    @PostMapping("/esl/force-refresh")
    public ResponseEntity<ApiResponse<Void>> forceRefreshEsl(
            @RequestParam String storeId,
            @RequestBody List<String> barcodes) {
        deviceService.forceRefreshEsl(storeId, barcodes);
        return ResponseEntity.ok(ApiResponse.success("Force refresh signal sent to ESL devices successfully", null));
    }

    /**
     * GET /api/devices/esl/available
     * Returns unbound ESL devices (bindState=0) for a given store — used to populate Bind dialog.
     */
    @GetMapping("/esl/available")
    public ResponseEntity<ApiResponse<List<EslResponse>>> getAvailableEslDevices(
            @RequestParam(required = false) String storeId) {
        List<EslResponse> available = deviceService.getAvailableEslDevices(storeId);
        return ResponseEntity.ok(ApiResponse.success("Available ESL devices fetched successfully", available));
    }

    /**
     * POST /api/devices/esl/bind
     * Binds an ESL label to a product barcode, with optional AP MAC association.
     * Body: { storeId, itemBarCode, eslBarcode, apMac? }
     */
    @PostMapping("/esl/bind")
    public ResponseEntity<ApiResponse<Void>> bindEsl(@RequestBody Map<String, String> request) {
        String storeId   = request.get("storeId");
        String itemBarCode = request.get("itemBarCode");
        String eslBarcode  = request.get("eslBarcode");
        String apMac       = request.get("apMac");

        if (storeId == null || storeId.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("storeId is required", 400));
        }
        if (itemBarCode == null || itemBarCode.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("itemBarCode is required", 400));
        }
        if (eslBarcode == null || eslBarcode.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("eslBarcode is required", 400));
        }

        deviceService.bindEsl(storeId, itemBarCode, eslBarcode, apMac);
        return ResponseEntity.ok(ApiResponse.success("ESL bound to product successfully", null));
    }

    /**
     * POST /api/devices/esl/unbind
     * Unbinds one or more ESL labels from their bound products.
     * Body: { storeId, eslBarcodes: [string] }
     */
    @PostMapping("/esl/unbind")
    public ResponseEntity<ApiResponse<Void>> unbindEsl(@RequestBody Map<String, Object> request) {
        String storeId = request.get("storeId") != null ? request.get("storeId").toString() : null;
        Object barcodesObj = request.get("eslBarcodes");

        if (storeId == null || storeId.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("storeId is required", 400));
        }
        if (!(barcodesObj instanceof List)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("eslBarcodes list is required", 400));
        }

        @SuppressWarnings("unchecked")
        List<String> barcodes = (List<String>) barcodesObj;
        if (barcodes.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("eslBarcodes list cannot be empty", 400));
        }

        deviceService.unbindEsl(storeId, barcodes);
        return ResponseEntity.ok(ApiResponse.success("ESL unbound successfully", null));
    }
}


