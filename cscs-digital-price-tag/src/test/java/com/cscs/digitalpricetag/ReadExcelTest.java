package com.cscs.digitalpricetag;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.File;
import org.junit.jupiter.api.Test;
import java.io.File;
import java.io.FileInputStream;
import java.util.Iterator;

public class ReadExcelTest {
    @Test
    public void testReadExcel() {
        String[] files = {
            "C:\\Users\\NICK\\Downloads\\products.xlsx",
            "C:\\Users\\NICK\\Downloads\\Single_specification_template.xlsx"
        };
        for (String filePath : files) {
            System.out.println("=== EXCEL FILE INSPECTION: " + filePath + " ===");
            File f = new File(filePath);
            if (!f.exists()) {
                System.out.println("File not found!");
                continue;
            }
            try (FileInputStream is = new FileInputStream(f);
                 org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
                
                System.out.println("Number of sheets: " + workbook.getNumberOfSheets());
                
                for (int i = 0; i < Math.min(workbook.getNumberOfSheets(), 2); i++) {
                    org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(i);
                    System.out.println("Sheet " + i + ": '" + sheet.getSheetName() + "'");
                    
                    Iterator<org.apache.poi.ss.usermodel.Row> rowIterator = sheet.iterator();
                    if (rowIterator.hasNext()) {
                        org.apache.poi.ss.usermodel.Row headerRow = rowIterator.next();
                        System.out.print("  Headers: [");
                        for (org.apache.poi.ss.usermodel.Cell cell : headerRow) {
                            try {
                                System.out.print("'" + cell.getStringCellValue() + "', ");
                            } catch (Exception e) {
                                System.out.print("'" + cell.toString() + "', ");
                            }
                        }
                        System.out.println("]");
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
