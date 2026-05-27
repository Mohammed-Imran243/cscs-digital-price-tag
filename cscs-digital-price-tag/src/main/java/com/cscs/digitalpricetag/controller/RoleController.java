package com.cscs.digitalpricetag.controller;

import com.cscs.digitalpricetag.dto.ApiResponse;
import com.cscs.digitalpricetag.dto.CreateRoleRequestDto;
import com.cscs.digitalpricetag.service.RoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@PreAuthorize("hasAuthority('staffManager')")
@RequestMapping("/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping("/permissions")
    public ResponseEntity<ApiResponse<Object>> getPermissions(@RequestParam(required = false) String roleId) {
        return ResponseEntity.ok(ApiResponse.success("Permissions fetched successfully", roleService.getPermissions(roleId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Object>> listRoles(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return ResponseEntity.ok(ApiResponse.success("Roles fetched successfully", roleService.listRoles(pageNum, pageSize)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> addRole(@RequestBody CreateRoleRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success("Role added successfully", roleService.addRole(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> updateRole(
            @PathVariable String id,
            @RequestBody CreateRoleRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success("Role updated successfully", roleService.updateRole(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteRole(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Role deleted successfully", roleService.deleteRole(id)));
    }
}
