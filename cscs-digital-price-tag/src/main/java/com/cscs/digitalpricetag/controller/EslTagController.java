package com.cscs.digitalpricetag.controller;

import com.cscs.digitalpricetag.dto.ImportResponse;
import com.cscs.digitalpricetag.service.ImportExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/esl-tags")
@PreAuthorize("hasAuthority('equipment')")
public class EslTagController {

    private final ImportExportService importExportService;

    public EslTagController(ImportExportService importExportService) {
        this.importExportService = importExportService;
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportResponse> importEslTags(
            @RequestParam(value = "storeId", required = false) String storeId,
            @RequestParam("file") MultipartFile file) {
        ImportResponse response = importExportService.importEslTags(file, storeId);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportEslTags(
            @RequestParam(value = "storeId", required = false) String storeId) throws IOException {
        byte[] excelData = importExportService.exportEslTags(storeId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=esl-tags.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelData);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/import-template")
    public ResponseEntity<byte[]> getImportTemplate() throws IOException {
        byte[] templateData = importExportService.getEslTagImportTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=esl_tag_import_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(templateData);
    }
}
