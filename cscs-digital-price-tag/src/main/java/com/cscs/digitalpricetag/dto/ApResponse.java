package com.cscs.digitalpricetag.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ApResponse {

    private String id;
    private String apName;
    private String mac;
    private String model;
    private String ip;
    private Integer eslCount;
    private String online;
    private Integer rebootState;
    private String softVersion;
    private String joinTime;
    private String storeId;

    public ApResponse() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getApName() { return apName; }
    public void setApName(String apName) { this.apName = apName; }

    public String getMac() { return mac; }
    public void setMac(String mac) { this.mac = mac; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }

    public Integer getEslCount() { return eslCount; }
    public void setEslCount(Integer eslCount) { this.eslCount = eslCount; }

    public String getOnline() { return online; }
    public void setOnline(String online) { this.online = online; }

    public Integer getRebootState() { return rebootState; }
    public void setRebootState(Integer rebootState) { this.rebootState = rebootState; }

    public String getSoftVersion() { return softVersion; }
    public void setSoftVersion(String softVersion) { this.softVersion = softVersion; }

    public String getJoinTime() { return joinTime; }
    public void setJoinTime(String joinTime) { this.joinTime = joinTime; }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }
}
