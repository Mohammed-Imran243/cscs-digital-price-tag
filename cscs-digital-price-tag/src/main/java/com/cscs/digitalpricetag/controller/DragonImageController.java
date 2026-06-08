package com.cscs.digitalpricetag.controller;

import com.cscs.digitalpricetag.service.DragonImageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/dragon/image")
public class DragonImageController {

    private final DragonImageService dragonImageService;

    public DragonImageController(DragonImageService dragonImageService) {
        this.dragonImageService = dragonImageService;
    }

    @GetMapping
    public ResponseEntity<String> getImage(@RequestParam @NotBlank String path) {
        String base64Image = dragonImageService.getBase64Image(path);
        if (base64Image != null) {
            return ResponseEntity.ok(base64Image);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
