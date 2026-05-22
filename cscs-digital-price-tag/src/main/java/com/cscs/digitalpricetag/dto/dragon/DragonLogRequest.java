package com.cscs.digitalpricetag.dto.dragon;

public class DragonLogRequest {
    private Long storeId;
    private String createdTime;
    private Integer operation;
    private Integer status;
    private String priceTagBarCode;
    private String itemBarCode;
    private String itemName;
    private String feedBackTimeOrder;
    private String timeCostOrder;

    // Getters and Setters
    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }

    public String getCreatedTime() { return createdTime; }
    public void setCreatedTime(String createdTime) { this.createdTime = createdTime; }

    public Integer getOperation() { return operation; }
    public void setOperation(Integer operation) { this.operation = operation; }

    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }

    public String getPriceTagBarCode() { return priceTagBarCode; }
    public void setPriceTagBarCode(String priceTagBarCode) { this.priceTagBarCode = priceTagBarCode; }

    public String getItemBarCode() { return itemBarCode; }
    public void setItemBarCode(String itemBarCode) { this.itemBarCode = itemBarCode; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public String getFeedBackTimeOrder() { return feedBackTimeOrder; }
    public void setFeedBackTimeOrder(String feedBackTimeOrder) { this.feedBackTimeOrder = feedBackTimeOrder; }

    public String getTimeCostOrder() { return timeCostOrder; }
    public void setTimeCostOrder(String timeCostOrder) { this.timeCostOrder = timeCostOrder; }
}


