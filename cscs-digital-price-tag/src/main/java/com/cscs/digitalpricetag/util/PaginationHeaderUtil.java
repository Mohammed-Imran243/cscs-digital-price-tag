package com.cscs.digitalpricetag.util;

import com.cscs.digitalpricetag.dto.api.ApiResponse;
import com.cscs.digitalpricetag.dto.api.PagedResponse;
import com.cscs.digitalpricetag.dto.dragon.DragonTemplateListResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

public class PaginationHeaderUtil {

    public static <T> ResponseEntity<ApiResponse<T>> buildPagedResponse(ApiResponse<T> apiResponse) {
        HttpHeaders headers = new HttpHeaders();
        T data = apiResponse.getData();

        if (data instanceof PagedResponse<?>) {
            PagedResponse<?> paged = (PagedResponse<?>) data;
            headers.add("X-Total-Count", String.valueOf(paged.getTotalElements()));
            headers.add("X-Total-Pages", String.valueOf(paged.getTotalPages()));
            headers.add("Access-Control-Expose-Headers", "X-Total-Count, X-Total-Pages");
        } else if (data instanceof DragonTemplateListResponse) {
            DragonTemplateListResponse templateList = (DragonTemplateListResponse) data;
            if (templateList.getData() != null) {
                Long totalElements = templateList.getData().getTotalElements();
                Long totalPages = templateList.getData().getTotalPages();
                if (totalElements != null) {
                    headers.add("X-Total-Count", String.valueOf(totalElements));
                }
                if (totalPages != null) {
                    headers.add("X-Total-Pages", String.valueOf(totalPages));
                }
                headers.add("Access-Control-Expose-Headers", "X-Total-Count, X-Total-Pages");
            }
        } else if (data instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) data;
            Object total = map.get("total");
            if (total == null) total = map.get("totalElements");
            if (total == null) total = map.get("totalCount");
            if (total instanceof Number) {
                headers.add("X-Total-Count", total.toString());
                Object pages = map.get("totalPages");
                if (pages == null) pages = map.get("pages");
                if (pages instanceof Number) {
                    headers.add("X-Total-Pages", pages.toString());
                }
                headers.add("Access-Control-Expose-Headers", "X-Total-Count, X-Total-Pages");
            }
        }

        return new ResponseEntity<>(apiResponse, headers, HttpStatus.OK);
    }
}
