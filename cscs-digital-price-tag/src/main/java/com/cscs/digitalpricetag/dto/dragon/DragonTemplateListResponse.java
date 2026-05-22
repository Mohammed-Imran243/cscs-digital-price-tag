package com.cscs.digitalpricetag.dto.dragon;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DragonTemplateListResponse {

    private Integer code;
    private String message;
    private DragonTemplateData data;
    private boolean success;

    public Integer getCode() { return code; }
    public void setCode(Integer code) { this.code = code; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public DragonTemplateData getData() { return data; }
    public void setData(DragonTemplateData data) { this.data = data; }

    public boolean isSuccess() { return success && (code != null && code == 10000); }
    public void setSuccess(boolean success) { this.success = success; }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DragonTemplateData {
        private Long numberOfElements;
        private Long totalPages;
        private Long totalElements;
        private List<DragonTemplateItem> content;

        public Long getNumberOfElements() { return numberOfElements; }
        public void setNumberOfElements(Long numberOfElements) { this.numberOfElements = numberOfElements; }

        public Long getTotalPages() { return totalPages; }
        public void setTotalPages(Long totalPages) { this.totalPages = totalPages; }

        public Long getTotalElements() { return totalElements; }
        public void setTotalElements(Long totalElements) { this.totalElements = totalElements; }

        public List<DragonTemplateItem> getContent() { return content; }
        public void setContent(List<DragonTemplateItem> content) { this.content = content; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DragonTemplateItem {
        private Long id;
        private String templateNumber;
        private String templateName;
        private String size;
        private String resolution;
        private String attrCategory;
        private String tempPicUrl;
        private List<String> modelList;
        private Long storeId;
        private Integer isEnable;
        private List<String> tempPicUrls;
        private String createdTime;
        private String updateTime;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getTemplateNumber() { return templateNumber; }
        public void setTemplateNumber(String templateNumber) { this.templateNumber = templateNumber; }

        public String getTemplateName() { return templateName; }
        public void setTemplateName(String templateName) { this.templateName = templateName; }

        public String getSize() { return size; }
        public void setSize(String size) { this.size = size; }

        public String getResolution() { return resolution; }
        public void setResolution(String resolution) { this.resolution = resolution; }

        public String getAttrCategory() { return attrCategory; }
        public void setAttrCategory(String attrCategory) { this.attrCategory = attrCategory; }

        public String getTempPicUrl() {
            if (tempPicUrl != null && !tempPicUrl.isBlank()) {
                return tempPicUrl;
            }
            if (tempPicUrls != null && !tempPicUrls.isEmpty()) {
                return tempPicUrls.get(0);
            }
            return null;
        }
        public void setTempPicUrl(String tempPicUrl) { this.tempPicUrl = tempPicUrl; }

        public List<String> getModelList() { return modelList; }
        public void setModelList(List<String> modelList) { this.modelList = modelList; }

        public Long getStoreId() { return storeId; }
        public void setStoreId(Long storeId) { this.storeId = storeId; }

        public Integer getIsEnable() { return isEnable; }
        @com.fasterxml.jackson.annotation.JsonProperty("isEnable")
        public void setIsEnable(Integer isEnable) { this.isEnable = isEnable; }

        public String getStatus() {
            return isEnable != null ? isEnable.toString() : "0";
        }

        public List<String> getTempPicUrls() { return tempPicUrls; }
        @com.fasterxml.jackson.annotation.JsonProperty("tempPicUrls")
        public void setTempPicUrls(List<String> tempPicUrls) { this.tempPicUrls = tempPicUrls; }

        public String getCreatedTime() { return createdTime; }
        public void setCreatedTime(String createdTime) { this.createdTime = createdTime; }

        public String getUpdateTime() { return updateTime; }
        public void setUpdateTime(String updateTime) { this.updateTime = updateTime; }
    }
}


