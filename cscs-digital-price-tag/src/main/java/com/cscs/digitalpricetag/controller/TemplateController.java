package com.cscs.digitalpricetag.controller;

import com.cscs.digitalpricetag.dto.ApiResponse;
import com.cscs.digitalpricetag.dto.dragon.DragonTemplateListResponse;
import com.cscs.digitalpricetag.service.TemplateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/templates")
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success("Categories fetched successfully", templateService.getCategories()));
    }

    @GetMapping("/types")
    public ResponseEntity<ApiResponse<List<String>>> getTemplateTypes() {
        return ResponseEntity.ok(ApiResponse.success("Template types fetched successfully", templateService.getTemplateTypes()));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<Object>> addCategory(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ApiResponse.success("Category added successfully", templateService.addCategory(request)));
    }

    @GetMapping("/models")
    public ResponseEntity<ApiResponse<Object>> getModels() {
        return ResponseEntity.ok(ApiResponse.success("Models fetched successfully", templateService.getModels()));
    }

    @PostMapping("/list")
    public ResponseEntity<ApiResponse<DragonTemplateListResponse>> getTemplates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestBody(required = false) Map<String, Object> searchParams) {
        return ResponseEntity.ok(ApiResponse.success("Templates fetched successfully", templateService.getTemplates(page, size, searchParams)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> getTemplateById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Template fetched successfully", templateService.getTemplateBaseById(id)));
    }

    @GetMapping("/check-name")
    public ResponseEntity<ApiResponse<Object>> checkTemplateName(
            @RequestParam String storeId,
            @RequestParam String templateName) {
        return ResponseEntity.ok(ApiResponse.success("Template name checked", templateService.checkTemplateName(storeId, templateName)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> addTemplate(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ApiResponse.success("Template added successfully", templateService.addTemplate(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> updateTemplateBase(
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ApiResponse.success("Template updated successfully", templateService.updateTemplateBase(id, request)));
    }

    @PutMapping("/{id}/enable/{status}")
    public ResponseEntity<ApiResponse<Object>> enableTemplate(
            @PathVariable String id,
            @PathVariable String status) {
        return ResponseEntity.ok(ApiResponse.success("Template enable status updated", templateService.enableTemplate(id, status)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteTemplate(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "0") String storeId,
            @RequestParam(required = false, defaultValue = "false") boolean isCompel) {
        return ResponseEntity.ok(ApiResponse.success("Template deleted successfully", templateService.deleteTemplate(id, storeId, isCompel)));
    }
}

