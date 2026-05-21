package com.cscs.digitalpricetag.dto.api;

public class AuditLogResponse {
    private Long id;
    private String itemBarCode;
    private String itemName;
    private String price;
    private String priceTagBarCode;
    private String model;
    private Integer operation;
    private String operationText;
    private Integer status;
    private String statusText;
    private String operator;
    private String pushTime;
    private String feedbackTime;
    private String createdTime;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getItemBarCode() { return itemBarCode; }
    public void setItemBarCode(String itemBarCode) { this.itemBarCode = itemBarCode; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public String getPrice() { return price; }
    public void setPrice(String price) { this.price = price; }

    public String getPriceTagBarCode() { return priceTagBarCode; }
    public void setPriceTagBarCode(String priceTagBarCode) { this.priceTagBarCode = priceTagBarCode; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public Integer getOperation() { return operation; }
    public void setOperation(Integer operation) { this.operation = operation; }

    public String getOperationText() { return operationText; }
    public void setOperationText(String operationText) { this.operationText = operationText; }

    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }

    public String getStatusText() { return statusText; }
    public void setStatusText(String statusText) { this.statusText = statusText; }

    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }

    public String getPushTime() { return pushTime; }
    public void setPushTime(String pushTime) { this.pushTime = pushTime; }

    public String getFeedbackTime() { return feedbackTime; }
    public void setFeedbackTime(String feedbackTime) { this.feedbackTime = feedbackTime; }

    public String getCreatedTime() { return createdTime; }
    public void setCreatedTime(String createdTime) { this.createdTime = createdTime; }
}
