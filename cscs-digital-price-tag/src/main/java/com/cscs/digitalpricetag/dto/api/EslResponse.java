package com.cscs.digitalpricetag.dto.api;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class EslResponse {

    private String id;
    private String priceTagCode;
    private String oemModel;
    private String itemBarCode;
    private String itemTitle;
    private String state;
    private Integer battery;
    private Integer batteryLevel;
    private Integer bindState;
    private Integer apSignal;
    private String lastCommuTime;
    private String updateTime;
    private String bindTime;
    private String storeId;

    public EslResponse() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPriceTagCode() { return priceTagCode; }
    public void setPriceTagCode(String priceTagCode) { this.priceTagCode = priceTagCode; }

    public String getOemModel() { return oemModel; }
    public void setOemModel(String oemModel) { this.oemModel = oemModel; }

    public String getItemBarCode() { return itemBarCode; }
    public void setItemBarCode(String itemBarCode) { this.itemBarCode = itemBarCode; }

    public String getItemTitle() { return itemTitle; }
    public void setItemTitle(String itemTitle) { this.itemTitle = itemTitle; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public Integer getBattery() { return battery; }
    public void setBattery(Integer battery) { this.battery = battery; }

    public Integer getBatteryLevel() { return batteryLevel; }
    public void setBatteryLevel(Integer batteryLevel) { this.batteryLevel = batteryLevel; }

    public Integer getBindState() { return bindState; }
    public void setBindState(Integer bindState) { this.bindState = bindState; }

    public Integer getApSignal() { return apSignal; }
    public void setApSignal(Integer apSignal) { this.apSignal = apSignal; }

    public String getLastCommuTime() { return lastCommuTime; }
    public void setLastCommuTime(String lastCommuTime) { this.lastCommuTime = lastCommuTime; }

    public String getUpdateTime() { return updateTime; }
    public void setUpdateTime(String updateTime) { this.updateTime = updateTime; }

    public String getBindTime() { return bindTime; }
    public void setBindTime(String bindTime) { this.bindTime = bindTime; }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }
}
