package com.cscs.digitalpricetag.dto.dragon;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DragonBatchBindRequest {
    @JsonProperty("storeId")
    private Long storeId;
    
    @JsonProperty("tagItemBinds")
    private List<TagItemBind> tagItemBinds;
    
    @Data
    @Builder
    public static class TagItemBind {
        @JsonProperty("eslBarcode")
        private String eslBarcode;
        
        @JsonProperty("itemBarcode")
        private String itemBarcode;
    }
}
