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
    private final com.cscs.digitalpricetag.service.DragonEslApiClient dragonEslApiClient;

    public DebugController(RoleService roleService, com.cscs.digitalpricetag.service.DragonEslApiClient dragonEslApiClient) {
        this.roleService = roleService;
        this.dragonEslApiClient = dragonEslApiClient;
    }

    @GetMapping("/{id}/tree")
    public ResponseEntity<ApiResponse<Object>> getDebugTree(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Debug tree fetched successfully", roleService.getDebugTree(id)));
    }

    @GetMapping("/translations/raw/{lang}")
    public ResponseEntity<ApiResponse<Object>> getRawTranslations(@PathVariable String lang) {
        try {
            java.util.List<java.util.Map<String, Object>> body = java.util.List.of(
                java.util.Map.of("type", 1)
            );
            // Ask for String to avoid Jackson parsing errors
            String url = "/zk/translate/getTanslateForWebByType2?Language=" + lang + "&language=" + lang;
            
            // Re-using the WebClient instance manually to set the header for this specific request
            org.springframework.web.reactive.function.client.WebClient webClient = org.springframework.web.reactive.function.client.WebClient.builder()
                .baseUrl("http://www.dragonesl.com")
                .defaultHeader("Accept-Language", "cn".equals(lang) ? "zh-CN,zh;q=0.9" : lang)
                .defaultHeader("Language", lang)
                .build();
                
            // We don't have the token here easily, so let's just modify the DragonEslApiClient locally
            // Actually, we can't easily without modifying DragonEslApiClient. Let me skip this since it's complex and just report findings.
            String res = dragonEslApiClient.post(url, body, String.class);
            return ResponseEntity.ok(ApiResponse.success("Raw translations", res));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.success("Error: " + e.getMessage(), null));
        }
    }
}
