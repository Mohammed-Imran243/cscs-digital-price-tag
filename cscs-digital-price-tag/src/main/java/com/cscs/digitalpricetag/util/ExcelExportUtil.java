package com.cscs.digitalpricetag.util;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

public class ExcelExportUtil {

    public static byte[] generateExcel(List<String> headers, List<Map<String, Object>> dataRows) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Export");
            
            // Header
            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            
            for (int i = 0; i < headers.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers.get(i));
                cell.setCellStyle(headerStyle);
            }
            
            // Data
            int rowIndex = 1;
            for (Map<String, Object> rowData : dataRows) {
                Row row = sheet.createRow(rowIndex++);
                for (int i = 0; i < headers.size(); i++) {
                    String header = headers.get(i);
                    Object val = rowData.get(header);
                    Cell cell = row.createCell(i);
                    if (val != null) {
                        if (val instanceof Number) {
                            cell.setCellValue(((Number) val).doubleValue());
                        } else if (val instanceof Boolean) {
                            cell.setCellValue((Boolean) val);
                        } else {
                            cell.setCellValue(val.toString());
                        }
                    }
                }
            }
            
            // Auto size columns (wrapped in try-catch to handle headless server environments)
            try {
                for (int i = 0; i < headers.size(); i++) {
                    sheet.autoSizeColumn(i);
                }
            } catch (Exception e) {
                // Ignore font measurement issues in headless server environments
            }
            
            workbook.write(out);
            return out.toByteArray();
        }
    }
}
