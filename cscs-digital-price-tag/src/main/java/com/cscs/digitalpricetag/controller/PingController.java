package com.cscs.digitalpricetag.controller;

import com.cscs.digitalpricetag.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
public class PingController {

    @GetMapping("/ping")
    public ResponseEntity<Map<String, Object>> ping() {

        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "HRMS service is running successfully");
        response.put("timestamp", Instant.now());

        return ResponseEntity.ok(response);
    }
}
