package com.cscs.digitalpricetag.dto.dragon;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DragonBatchImportRequest {
    @JsonProperty("storeId")
    private Long storeId;
    
    @JsonProperty("merchantId")
    private Long merchantId;
    
    @JsonProperty("agencyId")
    private Long agencyId;
    
    @JsonProperty("unitName")
    private Integer unitName;
    
    @JsonProperty("itemList")
    private List<Item> itemList;
    
    @Data
    @Builder
    public static class Item {
        @JsonProperty("barCode")
        private String barCode;
        
        @JsonProperty("itemTitle")
        private String itemTitle;
        
        @JsonProperty("price")
        private String price;
        
        @JsonProperty("originalPrice")
        private String originalPrice;
        
        @JsonProperty("unit")
        private String unit;
        
        @JsonProperty("productArea")
        private String productArea;
        
        @JsonProperty("attrCategory")
        private String attrCategory;
        
        @JsonProperty("attrName")
        private String attrName;
        
        @JsonProperty("shortTitle")
        private String shortTitle;
        
        @JsonProperty("classLevel")
        private String classLevel;
        
        @JsonProperty("qrCode")
        private String qrCode;
        
        @JsonProperty("nfcUrl")
        private String nfcUrl;
        
        @JsonProperty("spec")
        private String spec;
        
        @JsonProperty("custFeature1")
        private String custFeature1;
        
        @JsonProperty("custFeature2")
        private String custFeature2;
        
        // adding up to 50 if needed, we'll keep 5 for now
        @JsonProperty("custFeature3")
        private String custFeature3;
        
        @JsonProperty("custFeature4")
        private String custFeature4;
        
        @JsonProperty("custFeature5")
        private String custFeature5;
    }
}
