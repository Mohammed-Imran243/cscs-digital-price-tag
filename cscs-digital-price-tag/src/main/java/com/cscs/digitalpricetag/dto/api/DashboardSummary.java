package com.cscs.digitalpricetag.dto.api;

import java.util.List;

public class DashboardSummary {
    private int merchantCount;
    private int activeMerchantCount;
    private int storeCount;
    private int activeStoreCount;
    private long productCount;
    private long templateCount;
    private long categoryCount;
    private long apCount;
    private long eslCount;
    private String lastUpdated;
    private List<StoreBreakdown> storeBreakdowns;

    public static class StoreBreakdown {
        private String storeId;
        private String storeName;
        private long productCount;
        private long apTotalCount;
        private long apOnlineCount;
        private long eslTotalCount;

        public StoreBreakdown() {}

        public StoreBreakdown(String storeId, String storeName, long productCount, long apTotalCount, long apOnlineCount, long eslTotalCount) {
            this.storeId = storeId;
            this.storeName = storeName;
            this.productCount = productCount;
            this.apTotalCount = apTotalCount;
            this.apOnlineCount = apOnlineCount;
            this.eslTotalCount = eslTotalCount;
        }

        public String getStoreId() { return storeId; }
        public void setStoreId(String storeId) { this.storeId = storeId; }
        public String getStoreName() { return storeName; }
        public void setStoreName(String storeName) { this.storeName = storeName; }
        public long getProductCount() { return productCount; }
        public void setProductCount(long productCount) { this.productCount = productCount; }
        public long getApTotalCount() { return apTotalCount; }
        public void setApTotalCount(long apTotalCount) { this.apTotalCount = apTotalCount; }
        public long getApOnlineCount() { return apOnlineCount; }
        public void setApOnlineCount(long apOnlineCount) { this.apOnlineCount = apOnlineCount; }
        public long getEslTotalCount() { return eslTotalCount; }
        public void setEslTotalCount(long eslTotalCount) { this.eslTotalCount = eslTotalCount; }
    }

    public DashboardSummary() {}

    public int getMerchantCount() { return merchantCount; }
    public void setMerchantCount(int merchantCount) { this.merchantCount = merchantCount; }

    public int getActiveMerchantCount() { return activeMerchantCount; }
    public void setActiveMerchantCount(int activeMerchantCount) { this.activeMerchantCount = activeMerchantCount; }

    public int getStoreCount() { return storeCount; }
    public void setStoreCount(int storeCount) { this.storeCount = storeCount; }

    public int getActiveStoreCount() { return activeStoreCount; }
    public void setActiveStoreCount(int activeStoreCount) { this.activeStoreCount = activeStoreCount; }

    public long getProductCount() { return productCount; }
    public void setProductCount(long productCount) { this.productCount = productCount; }

    public long getTemplateCount() { return templateCount; }
    public void setTemplateCount(long templateCount) { this.templateCount = templateCount; }

    public long getCategoryCount() { return categoryCount; }
    public void setCategoryCount(long categoryCount) { this.categoryCount = categoryCount; }

    public long getApCount() { return apCount; }
    public void setApCount(long apCount) { this.apCount = apCount; }

    public long getEslCount() { return eslCount; }
    public void setEslCount(long eslCount) { this.eslCount = eslCount; }

    public String getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(String lastUpdated) { this.lastUpdated = lastUpdated; }

    public List<StoreBreakdown> getStoreBreakdowns() { return storeBreakdowns; }
    public void setStoreBreakdowns(List<StoreBreakdown> storeBreakdowns) { this.storeBreakdowns = storeBreakdowns; }
}
