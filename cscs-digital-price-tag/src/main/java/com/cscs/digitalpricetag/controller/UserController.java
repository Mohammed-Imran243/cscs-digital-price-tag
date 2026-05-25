package com.cscs.digitalpricetag.controller;

import com.cscs.digitalpricetag.dto.ApiResponse;
import com.cscs.digitalpricetag.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Map;

@RestController
@RequestMapping("/users")
@PreAuthorize("hasAuthority('staffManager')")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Object>> listUsers(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return ResponseEntity.ok(ApiResponse.success("Users fetched successfully", userService.listUsers(pageNum, pageSize)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> addUser(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ApiResponse.success("User added successfully", userService.addUser(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> updateUser(
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        // Ensure ID is passed in the request body as expected by Dragon ESL POST /zk/user/updateUser
        request.put("id", id);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", userService.updateUser(request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteUser(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", userService.deleteUser(id)));
    }
}
