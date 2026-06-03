package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.dto.api.PriceHistoryEvent;
import com.cscs.digitalpricetag.dto.api.ProductResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class PriceHistoryService {

    private static final Logger log = LoggerFactory.getLogger(PriceHistoryService.class);
    
    // Configured via Docker volume to /app/data
    // Fallback to local ./data folder if not in Docker
    private final String DATA_DIR = System.getenv("PRICE_HISTORY_DIR") != null 
            ? System.getenv("PRICE_HISTORY_DIR") 
            : "./data";
            
    private final String FILE_PATH = DATA_DIR + "/price_history.jsonl";
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PriceHistoryService() {
        ensureFileExists();
    }

    private void ensureFileExists() {
        try {
            File dir = new File(DATA_DIR);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            File file = new File(FILE_PATH);
            if (!file.exists()) {
                file.createNewFile();
            }
        } catch (IOException e) {
            log.error("Failed to initialize price history log file at {}", FILE_PATH, e);
        }
    }

    public void recordPriceChange(ProductResponse product, String oldPriceStr, String newPriceStr, String storeId) {
        if (oldPriceStr == null || newPriceStr == null) return;
        
        try {
            double oldPrice = Double.parseDouble(oldPriceStr);
            double newPrice = Double.parseDouble(newPriceStr);

            if (Double.compare(oldPrice, newPrice) == 0) {
                // No actual price change
                return;
            }

            String eventType = newPrice > oldPrice ? "PRICE_INCREASED" : "PRICE_DECREASED";
            double changePct = ((newPrice - oldPrice) / oldPrice) * 100.0;
            String changePctStr = String.format("%.1f", changePct);
            if (changePct > 0) {
                changePctStr = "+" + changePctStr;
            }

            PriceHistoryEvent event = new PriceHistoryEvent();
            event.setId(UUID.randomUUID().toString());
            event.setEventType(eventType);
            event.setTimestamp(ZonedDateTime.now(ZoneId.of("UTC")).format(DateTimeFormatter.ISO_INSTANT));
            event.setStoreId(storeId);
            event.setProductId(product.getId());
            event.setBarcode(product.getBarcode());
            event.setProductName(product.getItemName());
            event.setOldPrice(String.format("%.2f", oldPrice));
            event.setNewPrice(String.format("%.2f", newPrice));
            event.setChangePercentage(changePctStr + "%");

            String jsonLine = objectMapper.writeValueAsString(event);
            Files.writeString(Paths.get(FILE_PATH), jsonLine + System.lineSeparator(), StandardOpenOption.APPEND);
            
            log.info("Recorded price history event: {} for product {} ({} -> {})", eventType, product.getBarcode(), oldPrice, newPrice);
            
        } catch (NumberFormatException e) {
            log.warn("Failed to parse price values for history recording. Old: {}, New: {}", oldPriceStr, newPriceStr);
        } catch (IOException e) {
            log.error("Failed to write to price history file", e);
        }
    }

    public List<PriceHistoryEvent> getPriceHistory(String storeId, String filterType, String timeRange) {
        Path path = Paths.get(FILE_PATH);
        if (!Files.exists(path)) {
            return Collections.emptyList();
        }

        List<PriceHistoryEvent> events = new ArrayList<>();
        try (Stream<String> lines = Files.lines(path)) {
            events = lines
                .filter(line -> line != null && !line.trim().isEmpty())
                .map(line -> {
                    try {
                        return objectMapper.readValue(line, PriceHistoryEvent.class);
                    } catch (Exception e) {
                        log.error("Failed to parse jsonl line: {}", line, e);
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
        } catch (IOException e) {
            log.error("Failed to read price history file", e);
            return Collections.emptyList();
        }

        // Apply filters
        return events.stream()
            .filter(e -> storeId == null || storeId.isEmpty() || storeId.equals("All Stores") || storeId.equals(e.getStoreId()))
            .filter(e -> filterType == null || filterType.isEmpty() || filterType.equals("All Types") || filterType.equals(e.getEventType()))
            .filter(e -> matchesTimeRange(e.getTimestamp(), timeRange))
            .collect(Collectors.toList());
    }

    private boolean matchesTimeRange(String timestampStr, String timeRange) {
        if (timeRange == null || timeRange.isEmpty() || timeRange.equals("All Time")) {
            return true;
        }
        
        try {
            ZonedDateTime eventTime = ZonedDateTime.parse(timestampStr);
            ZonedDateTime now = ZonedDateTime.now(ZoneId.of("UTC"));
            
            switch (timeRange) {
                case "Today":
                    return eventTime.isAfter(now.minusHours(24));
                case "Last 7 Days":
                    return eventTime.isAfter(now.minusDays(7));
                case "Last 30 Days":
                    return eventTime.isAfter(now.minusDays(30));
                default:
                    return true;
            }
        } catch (Exception e) {
            log.warn("Failed to parse timestamp for filtering: {}", timestampStr);
            return true;
        }
    }
}
