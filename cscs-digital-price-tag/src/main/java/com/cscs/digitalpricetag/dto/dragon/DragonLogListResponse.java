package com.cscs.digitalpricetag.dto.dragon;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Maps raw Dragon ESL response from /zk/erp/log/listLog
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class DragonLogListResponse {

    @JsonProperty("code")
    private Integer code;

    @JsonProperty("msg")
    private String msg;

    @JsonProperty("data")
    private DragonLogData data;

    public Integer getCode() { return code; }
    public void setCode(Integer code) { this.code = code; }

    public String getMsg() { return msg; }
    public void setMsg(String msg) { this.msg = msg; }

    public DragonLogData getData() { return data; }
    public void setData(DragonLogData data) { this.data = data; }

    public boolean isSuccess() {
        return code != null && (code == 10000 || code == 200);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DragonLogData {

        @JsonProperty("total")
        private Long total;

        @JsonProperty("list")
        private List<DragonLogItem> list;

        public Long getTotal() { return total != null ? total : 0L; }
        public void setTotal(Long total) { this.total = total; }

        public List<DragonLogItem> getList() { return list; }
        public void setList(List<DragonLogItem> list) { this.list = list; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DragonLogItem {
        @JsonProperty("id")
        private Long id;

        @JsonProperty("itemBarCode")
        private String itemBarCode;

        @JsonProperty("itemName")
        private String itemName;

        @JsonProperty("price")
        private String price;

        @JsonProperty("priceTagBarCode")
        private String priceTagBarCode;

        @JsonProperty("model")
        private String model;

        @JsonProperty("operation")
        private Integer operation;

        @JsonProperty("status")
        private Integer status;

        @JsonProperty("operator")
        private String operator;

        @JsonProperty("pushTime")
        private String pushTime;

        @JsonProperty("feedbackTime")
        private String feedbackTime;

        @JsonProperty("createdTime")
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

        public Integer getStatus() { return status; }
        public void setStatus(Integer status) { this.status = status; }

        public String getOperator() { return operator; }
        public void setOperator(String operator) { this.operator = operator; }

        public String getPushTime() { return pushTime; }
        public void setPushTime(String pushTime) { this.pushTime = pushTime; }

        public String getFeedbackTime() { return feedbackTime; }
        public void setFeedbackTime(String feedbackTime) { this.feedbackTime = feedbackTime; }

        public String getCreatedTime() { return createdTime; }
        public void setCreatedTime(String createdTime) { this.createdTime = createdTime; }
    }
}


