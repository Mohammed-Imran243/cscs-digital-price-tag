package com.cscs.digitalpricetag.controller;

import com.cscs.digitalpricetag.dto.ApiResponse;
import com.cscs.digitalpricetag.service.RoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/debug/role")
@PreAuthorize("hasAuthority('staffManager')")
public class DebugController {

    private final RoleService roleService;

    public DebugController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping("/{id}/tree")
    public ResponseEntity<ApiResponse<Object>> getDebugTree(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Debug tree fetched successfully", roleService.getDebugTree(id)));
    }
}
