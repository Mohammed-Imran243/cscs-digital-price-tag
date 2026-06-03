package com.cscs.digitalpricetag;

import com.cscs.digitalpricetag.dto.api.PriceHistoryEvent;
import com.cscs.digitalpricetag.dto.api.ProductResponse;
import com.cscs.digitalpricetag.service.PriceHistoryService;

import java.util.List;

public class TestVerification {
    public static void main(String[] args) {
        // Mock environment variable for local testing
        System.setProperty("PRICE_HISTORY_DIR", "./data_test");
        PriceHistoryService service = new PriceHistoryService();
        
        System.out.println("--- Starting Verifications ---");

        // Mock Product
        ProductResponse p = new ProductResponse();
        p.setId("123");
        p.setBarcode("999111222");
        p.setItemName("Test Product Alpha");

        // 1 & 2. Real Price Change & Increase Test
        System.out.println("\nTesting Price Increase (AED 10 -> AED 15)");
        service.recordPriceChange(p, "10.00", "15.00", "Store1");
        
        // 3. Price Decrease Test
        System.out.println("\nTesting Price Decrease (AED 15 -> AED 10)");
        service.recordPriceChange(p, "15.00", "10.00", "Store1");

        // 4. Duplicate Protection Test
        System.out.println("\nTesting Duplicate Protection (AED 10 -> AED 10)");
        service.recordPriceChange(p, "10.00", "10.00", "Store1");
        
        // Verify File
        List<PriceHistoryEvent> history = service.getPriceHistory("All Stores", "All Types", "All Time");
        System.out.println("\n--- Verification Results ---");
        System.out.println("Total records written (expected 2): " + history.size());
        
        for (PriceHistoryEvent e : history) {
            System.out.println("Event: " + e.getEventType() + " | " + e.getOldPrice() + " -> " + e.getNewPrice() + " | Change: " + e.getChangePercentage());
        }
        
        // 8. Performance Generation
        System.out.println("\nGenerating 500 records for performance test...");
        long start = System.currentTimeMillis();
        for (int i = 0; i < 500; i++) {
            service.recordPriceChange(p, String.valueOf(10 + i), String.valueOf(11 + i), "Store1");
        }
        long end = System.currentTimeMillis();
        System.out.println("Generated 500 records in " + (end - start) + "ms");
        
        long readStart = System.currentTimeMillis();
        List<PriceHistoryEvent> largeHistory = service.getPriceHistory("All Stores", "All Types", "All Time");
        long readEnd = System.currentTimeMillis();
        System.out.println("Read " + largeHistory.size() + " records in " + (readEnd - readStart) + "ms");
    }
}
