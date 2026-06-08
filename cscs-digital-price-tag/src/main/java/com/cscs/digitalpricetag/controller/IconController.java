package com.cscs.digitalpricetag.controller;

import com.cscs.digitalpricetag.dto.ApiResponse;
import com.cscs.digitalpricetag.service.IconService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Map;

@RestController
@RequestMapping("/zk/icon")
public class IconController {

    private final IconService iconService;

    public IconController(IconService iconService) {
        this.iconService = iconService;
    }

    /**
     * Fetch all icons/components already linked to the template
     * GET /zk/icon/findInTemp/{templateId}
     */
    @GetMapping("/findInTemp/{templateId}")
    public ResponseEntity<ApiResponse<Object>> findIconsInTemplate(@PathVariable String templateId) {
        Object result = iconService.findIconsInTemplate(templateId);
        return ResponseEntity.ok(ApiResponse.success("Template icons fetched successfully", result));
    }

    /**
     * Add an icon/component to an existing template
     * POST /zk/icon/addToTemp/{templateId}
     */
    @PostMapping("/addToTemp/{templateId}")
    public ResponseEntity<ApiResponse<Object>> addIconToTemplate(
            @PathVariable String templateId,
            @RequestBody Map<String, Object> iconData) {
        Object result = iconService.addIconToTemplate(templateId, iconData);
        return ResponseEntity.ok(ApiResponse.success("Icon added to template successfully", result));
    }

    /**
     * Remove an icon/component from a template
     * DELETE /zk/icon/removeFromTemp/{templateId}/{iconId}
     */
    @DeleteMapping("/removeFromTemp/{templateId}/{iconId}")
    public ResponseEntity<ApiResponse<Object>> removeIconFromTemplate(
            @PathVariable String templateId,
            @PathVariable String iconId) {
        Object result = iconService.removeIconFromTemplate(templateId, iconId);
        return ResponseEntity.ok(ApiResponse.success("Icon removed from template successfully", result));
    }

    /**
     * Update icon position/size in template
     * PUT /zk/icon/updateInTemp/{templateId}/{iconId}
     */
    @PutMapping("/updateInTemp/{templateId}/{iconId}")
    public ResponseEntity<ApiResponse<Object>> updateIconInTemplate(
            @PathVariable String templateId,
            @PathVariable String iconId,
            @RequestBody Map<String, Object> updateData) {
        Object result = iconService.updateIconInTemplate(templateId, iconId, updateData);
        return ResponseEntity.ok(ApiResponse.success("Icon updated successfully", result));
    }

    /**
     * Create a new store icon
     * POST /zk/icon/addCut
     */
    @PostMapping("/addCut")
    @PreAuthorize("hasAuthority('template')")
    public ResponseEntity<ApiResponse<Object>> addCut(@RequestBody Map<String, Object> payload) {
        Object result = iconService.addCut(payload);
        return ResponseEntity.ok(ApiResponse.success("Store icon created successfully", result));
    }

    /**
     * Delete a store icon
     * DELETE /zk/icon/delete/{iconId}
     */
    @DeleteMapping("/delete/{iconId}")
    @PreAuthorize("hasAuthority('template')")
    public ResponseEntity<ApiResponse<Object>> deleteIcon(@PathVariable String iconId) {
        Object result = iconService.deleteIcon(iconId);
        return ResponseEntity.ok(ApiResponse.success("Store icon deleted successfully", result));
    }
}