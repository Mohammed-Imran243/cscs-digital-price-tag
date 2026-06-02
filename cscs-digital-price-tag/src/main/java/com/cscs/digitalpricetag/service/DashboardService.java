package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.dto.api.DashboardSummary;
import com.cscs.digitalpricetag.dto.api.StoreResponse;
import com.cscs.digitalpricetag.dto.api.PagedResponse;
import com.cscs.digitalpricetag.dto.api.ProductResponse;
import com.cscs.digitalpricetag.dto.ApResponse;
import com.cscs.digitalpricetag.dto.api.EslResponse;
import com.cscs.digitalpricetag.dto.dragon.DragonTemplateListResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@Service
public class DashboardService {
    private static final Logger log = LoggerFactory.getLogger(DashboardService.class);

    private final StoreService storeService;
    private final MerchantService merchantService;
    private final TemplateService templateService;
    private final ProductService productService;
    private final DeviceService deviceService;

    private final ExecutorService executor = Executors.newFixedThreadPool(20);
    private final AtomicReference<DashboardSummary> cachedSummary = new AtomicReference<>(null);
    private final AtomicReference<Instant> lastFetchTime = new AtomicReference<>(Instant.MIN);
    private static final int CACHE_TTL_MINUTES = 3;

    public DashboardService(StoreService storeService,
                            MerchantService merchantService,
                            TemplateService templateService,
                            ProductService productService,
                            DeviceService deviceService) {
        this.storeService = storeService;
        this.merchantService = merchantService;
        this.templateService = templateService;
        this.productService = productService;
        this.deviceService = deviceService;
    }

    public DashboardSummary getSummary() {
        Instant now = Instant.now();
        if (cachedSummary.get() != null && lastFetchTime.get().plusSeconds(CACHE_TTL_MINUTES * 60L).isAfter(now)) {
            return cachedSummary.get();
        }

        DashboardSummary summary = new DashboardSummary();
        summary.setLastUpdated(DateTimeFormatter.ISO_INSTANT.format(now));

        // 1. Fetch Independent base data
        CompletableFuture<Map<String, Object>> merchantFuture = CompletableFuture.supplyAsync(() -> merchantService.getMerchantInfo(), executor);
        CompletableFuture<List<StoreResponse>> storesFuture = CompletableFuture.supplyAsync(() -> storeService.getAllStores(), executor);
        CompletableFuture<Long> activeStoreCountFuture = CompletableFuture.supplyAsync(() -> storeService.getActiveStoreCount(), executor);
        CompletableFuture<DragonTemplateListResponse> templatesFuture = CompletableFuture.supplyAsync(() -> templateService.getTemplates(0, 1, new HashMap<>()), executor);
        CompletableFuture<List<String>> categoriesFuture = CompletableFuture.supplyAsync(() -> templateService.getCategories(), executor);

        CompletableFuture.allOf(merchantFuture, storesFuture, activeStoreCountFuture, templatesFuture, categoriesFuture).join();

        // Populate base stats
        try {
            Map<String, Object> merchantInfo = merchantFuture.get();
            int mCount = (merchantInfo != null && !merchantInfo.isEmpty()) ? 1 : 0;
            summary.setMerchantCount(mCount);
            summary.setActiveMerchantCount(mCount);
        } catch (Exception e) {
            log.warn("Failed to get merchant info", e);
            summary.setMerchantCount(0);
            summary.setActiveMerchantCount(0);
        }

        List<StoreResponse> stores = null;
        try {
            stores = storesFuture.get();
            summary.setStoreCount(stores != null ? stores.size() : 0);
        } catch (Exception e) {
            log.warn("Failed to get stores", e);
            summary.setStoreCount(0);
        }

        try {
            summary.setActiveStoreCount(activeStoreCountFuture.get().intValue());
        } catch (Exception e) {
            summary.setActiveStoreCount(0);
        }

        try {
            DragonTemplateListResponse tmpl = templatesFuture.get();
            summary.setTemplateCount(tmpl != null && tmpl.getData() != null ? tmpl.getData().getTotalElements() : 0);
        } catch (Exception e) {
            summary.setTemplateCount(0);
        }

        try {
            List<String> cats = categoriesFuture.get();
            summary.setCategoryCount(cats != null ? cats.size() : 0);
        } catch (Exception e) {
            summary.setCategoryCount(0);
        }

        // 2. Fetch parallel data for all stores
        List<DashboardSummary.StoreBreakdown> breakdowns = new ArrayList<>();

        if (stores != null && !stores.isEmpty()) {
            List<CompletableFuture<DashboardSummary.StoreBreakdown>> storeFutures = stores.stream()
                .map(store -> CompletableFuture.supplyAsync(() -> {
                    long productCount = 0;
                    long apTotal = 0;
                    long apOnline = 0;
                    long eslTotal = 0;

                    try {
                        PagedResponse<ProductResponse> p = productService.getProducts(0, 1, store.getStoreId(), null, null);
                        if (p != null) productCount = p.getTotalElements();
                    } catch (Exception e) { log.warn("Dashboard product fetch error for store {}", store.getStoreId()); }

                    try {
                        PagedResponse<ApResponse> ap = deviceService.getApDevices(0, 100, store.getStoreId(), null);
                        if (ap != null) {
                            apTotal = ap.getTotalElements();
                            if (ap.getContent() != null) {
                                apOnline = ap.getContent().stream().filter(a -> "ONLINE".equals(a.getOnline())).count();
                            }
                        }
                    } catch (Exception e) { log.warn("Dashboard AP fetch error for store {}", store.getStoreId()); }

                    try {
                        PagedResponse<EslResponse> esl = deviceService.getEslDevices(0, 1, store.getStoreId(), null);
                        if (esl != null) eslTotal = esl.getTotalElements();
                    } catch (Exception e) { log.warn("Dashboard ESL fetch error for store {}", store.getStoreId()); }

                    return new DashboardSummary.StoreBreakdown(store.getStoreId(), store.getStoreName(), productCount, apTotal, apOnline, eslTotal);
                }, executor))
                .toList();

            CompletableFuture.allOf(storeFutures.toArray(new CompletableFuture[0])).join();

            for (CompletableFuture<DashboardSummary.StoreBreakdown> future : storeFutures) {
                try {
                    breakdowns.add(future.get());
                } catch (Exception e) { }
            }
        }

        long totalProducts = breakdowns.stream().mapToLong(DashboardSummary.StoreBreakdown::getProductCount).sum();
        long totalAps = breakdowns.stream().mapToLong(DashboardSummary.StoreBreakdown::getApTotalCount).sum();
        long totalEsls = breakdowns.stream().mapToLong(DashboardSummary.StoreBreakdown::getEslTotalCount).sum();

        summary.setStoreBreakdowns(breakdowns);
        summary.setProductCount(totalProducts);
        summary.setApCount(totalAps);
        summary.setEslCount(totalEsls);

        cachedSummary.set(summary);
        lastFetchTime.set(now);

        return summary;
    }
}
