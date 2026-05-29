package com.cscs.digitalpricetag.controller;

import com.cscs.digitalpricetag.dto.ApiResponse;
import com.cscs.digitalpricetag.dto.LoginRequest;
import com.cscs.digitalpricetag.dto.LoginResponse;
import com.cscs.digitalpricetag.dto.UserInfoResponse;
import com.cscs.digitalpricetag.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
      LoginResponse response = authService.login(request);
      return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserInfoResponse>> getMe(@RequestHeader("Authorization") String bearerToken) {
        UserInfoResponse response = authService.getMe(bearerToken);
        return ResponseEntity.ok(ApiResponse.success("User info retrieved", response));
    }

    @DeleteMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        // JWT is stateless, so we just acknowledge the logout request.
        // The client is responsible for discarding the token.
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }
}