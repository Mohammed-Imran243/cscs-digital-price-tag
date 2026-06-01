package com.cscs.digitalpricetag.controller;

import com.cscs.digitalpricetag.dto.ApiResponse;
import com.cscs.digitalpricetag.dto.dragon.DragonTemplateListResponse;
import com.cscs.digitalpricetag.service.TemplateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/templates")
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<Object>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success("Categories fetched successfully", templateService.getCategories()));
    }

    @GetMapping("/types")
    public ResponseEntity<ApiResponse<Object>> getTemplateTypes() {
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

    @PostMapping("/icons/list")
    public ResponseEntity<ApiResponse<Object>> getStoreIcons(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestBody(required = false) Map<String, Object> params) {
        return ResponseEntity.ok(ApiResponse.success("Store icons fetched successfully", templateService.getStoreIcons(page, size, params)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> getTemplateById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Template fetched successfully", templateService.getTemplateBaseById(id)));
    }

    @GetMapping("/{id}/findInTemp")
    public ResponseEntity<ApiResponse<Object>> findIconsInTemplate(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Template icons fetched successfully", templateService.findIconsInTemplate(id)));
    }

    @PostMapping("/{id}/addIcon")
    public ResponseEntity<ApiResponse<Object>> addIconToTemplate(
            @PathVariable String id,
            @RequestBody Map<String, Object> iconData) {
        return ResponseEntity.ok(ApiResponse.success("Icon added to template successfully", templateService.addIconToTemplate(id, iconData)));
    }

    @DeleteMapping("/{id}/removeIcon/{iconId}")
    public ResponseEntity<ApiResponse<Object>> removeIconFromTemplate(
            @PathVariable String id,
            @PathVariable String iconId) {
        return ResponseEntity.ok(ApiResponse.success("Icon removed from template successfully", templateService.removeIconFromTemplate(id, iconId)));
    }

    @PutMapping("/{id}/updateIcon/{iconId}")
    public ResponseEntity<ApiResponse<Object>> updateIconInTemplate(
            @PathVariable String id,
            @PathVariable String iconId,
            @RequestBody Map<String, Object> updateData) {
        return ResponseEntity.ok(ApiResponse.success("Icon updated successfully", templateService.updateIconInTemplate(id, iconId, updateData)));
    }

    @GetMapping("/check-name")
    public ResponseEntity<ApiResponse<Object>> checkTemplateName(
            @RequestParam String storeId,
            @RequestParam String templateName) {
        return ResponseEntity.ok(ApiResponse.success("Template name checked", templateService.checkTemplateName(storeId, templateName)));
    }

    @GetMapping("/fonts")
    public ResponseEntity<ApiResponse<Object>> getFontTypes() {
        return ResponseEntity.ok(ApiResponse.success("Font types fetched", templateService.getFontTypes()));
    }

    @GetMapping("/maxSubNum/{storeId}")
    public ResponseEntity<ApiResponse<Object>> getMaxSubNum(@PathVariable String storeId) {
        return ResponseEntity.ok(ApiResponse.success("Max sub number fetched", templateService.getMaxSubNum(storeId)));
    }

    @GetMapping("/itemPicName")
    public ResponseEntity<ApiResponse<Object>> getPictureNames(@RequestParam String storeId) {
        return ResponseEntity.ok(ApiResponse.success("Picture names fetched", templateService.getPictureNames(storeId)));
    }

    @GetMapping("/fieldNames/{type}")
    public ResponseEntity<ApiResponse<Object>> getFieldNames(@PathVariable String type) {
        return ResponseEntity.ok(ApiResponse.success("Field names fetched", templateService.getFieldNames(type)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> addTemplate(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ApiResponse.success("Template added successfully", templateService.addTemplate(request)));
    }

    @PostMapping("/preview")
    public ResponseEntity<ApiResponse<Object>> previewTemplate(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ApiResponse.success("Template preview generated successfully", templateService.previewTemplate(request)));
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