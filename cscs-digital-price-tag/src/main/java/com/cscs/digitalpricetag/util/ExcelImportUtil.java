package com.cscs.digitalpricetag.util;

import com.cscs.digitalpricetag.dto.ImportError;
import com.cscs.digitalpricetag.dto.ImportResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

public class ExcelImportUtil {

    public static <T> ImportResponse parseExcel(MultipartFile file, String[] expectedHeaders, Function<Map<String, String>, T> rowMapper, List<T> validRows) {
        ImportResponse response = new ImportResponse();
        
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            
            if (!rowIterator.hasNext()) {
                response.setSuccess(false);
                response.setMessage("Excel file is empty");
                return response;
            }
            
            Row headerRow = rowIterator.next();
            List<String> actualHeaders = new ArrayList<>();
            for (Cell cell : headerRow) {
                actualHeaders.add(getCellValue(cell).trim());
            }
            
            // Basic header validation
            for (String expected : expectedHeaders) {
                if (!actualHeaders.contains(expected)) {
                    response.setSuccess(false);
                    response.setMessage("Missing required column: " + expected);
                    return response;
                }
            }
            
            int rowIndex = 2; // 1-based index, skipping header (row 1)
            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                
                // Skip completely empty rows
                boolean isEmptyRow = true;
                for (int c = 0; c < actualHeaders.size(); c++) {
                    if (!getCellValue(row.getCell(c)).isEmpty()) {
                        isEmptyRow = false;
                        break;
                    }
                }
                if (isEmptyRow) {
                    rowIndex++;
                    continue;
                }
                
                response.setTotalRecords(response.getTotalRecords() + 1);
                
                Map<String, String> rowData = new java.util.HashMap<>();
                for (int c = 0; c < actualHeaders.size(); c++) {
                    rowData.put(actualHeaders.get(c), getCellValue(row.getCell(c)));
                }
                
                try {
                    T mappedObj = rowMapper.apply(rowData);
                    if (mappedObj == null) {
                        throw new IllegalArgumentException("Failed to map row data");
                    }
                    validRows.add(mappedObj);
                    response.setSuccessCount(response.getSuccessCount() + 1);
                } catch (IllegalArgumentException ex) {
                    response.addError(new ImportError(rowIndex, "Validation", ex.getMessage()));
                } catch (Exception ex) {
                    response.addError(new ImportError(rowIndex, "System", "Unexpected error: " + ex.getMessage()));
                }
                
                rowIndex++;
            }
            
            response.setSuccess(response.getFailedCount() == 0);
            if (response.getFailedCount() > 0) {
                response.setMessage("Import completed with errors. " + response.getSuccessCount() + " rows succeeded, " + response.getFailedCount() + " failed.");
            } else {
                response.setMessage("Import completed successfully.");
            }
            
        } catch (Exception e) {
            response.setSuccess(false);
            response.setMessage("Failed to parse Excel file: " + e.getMessage());
        }
        
        return response;
    }
    
    private static String getCellValue(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getDateCellValue().toString();
                } else {
                    double val = cell.getNumericCellValue();
                    // if it's practically an integer, strip the .0
                    if (val == Math.floor(val)) {
                        yield String.valueOf((long) val);
                    }
                    yield String.valueOf(val);
                }
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCellFormula();
            default -> "";
        };
    }
}
