package com.cscs.digitalpricetag.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportResponse {
    private boolean success;
    private String message;
    private int totalRecords;
    private int successCount;
    private int failedCount;
    
    @Builder.Default
    private List<ImportError> errors = new ArrayList<>();
    
    public void addError(ImportError error) {
        if (this.errors == null) {
            this.errors = new ArrayList<>();
        }
        this.errors.add(error);
        this.failedCount++;
    }
}
