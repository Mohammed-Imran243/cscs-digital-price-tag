package com.cscs.digitalpricetag.controller;

import com.cscs.digitalpricetag.dto.api.PriceHistoryEvent;
import com.cscs.digitalpricetag.service.PriceHistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/price-history")
public class PriceHistoryController {

    private final PriceHistoryService priceHistoryService;

    public PriceHistoryController(PriceHistoryService priceHistoryService) {
        this.priceHistoryService = priceHistoryService;
    }

    @GetMapping
    public ResponseEntity<List<PriceHistoryEvent>> getPriceHistory(
            @RequestParam(required = false) String storeId,
            @RequestParam(required = false) String filterType,
            @RequestParam(required = false) String timeRange) {
            
        List<PriceHistoryEvent> history = priceHistoryService.getPriceHistory(storeId, filterType, timeRange);
        return ResponseEntity.ok(history);
    }
}
