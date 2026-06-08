package com.cscs.digitalpricetag.controller;

import com.cscs.digitalpricetag.service.DragonEslApiClient;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ContentDisposition;

import java.util.HashMap;
import java.util.Map;
import java.io.IOException;

@RestController
@RequestMapping("/sys")
public class SysController {

    private final DragonEslApiClient dragonEslApiClient;

    public SysController(DragonEslApiClient dragonEslApiClient) {
        this.dragonEslApiClient = dragonEslApiClient;
    }

    /**
     * Proxy /sys/getPreViewPics to Dragon ESL.
     * Takes a multipart file and parseAlgorithm.
     */
    @PostMapping(value = "/getPreViewPics", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('template')")
    public ResponseEntity<byte[]> getPreViewPics(
            @RequestParam("file") MultipartFile file,
            @RequestParam("parseAlgorithm") String parseAlgorithm) throws IOException {

        Map<String, String> extraParts = new HashMap<>();
        extraParts.put("parseAlgorithm", parseAlgorithm);

        byte[] previewImage = dragonEslApiClient.postMultipart(
                "/zk/sys/getPreViewPics", 
                "file", 
                file, 
                extraParts, 
                byte[].class
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        headers.setContentDisposition(ContentDisposition.inline().filename("preview.png").build());

        return ResponseEntity.ok()
                .headers(headers)
                .body(previewImage);
    }
}
