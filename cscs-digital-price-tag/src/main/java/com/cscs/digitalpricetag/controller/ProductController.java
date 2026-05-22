package com.cscs.digitalpricetag.controller;

import com.cscs.digitalpricetag.dto.ApiResponse;
import com.cscs.digitalpricetag.dto.api.PagedResponse;
import com.cscs.digitalpricetag.dto.api.PriceUpdateRequest;
import com.cscs.digitalpricetag.dto.api.ProductCreateRequest;
import com.cscs.digitalpricetag.dto.api.ProductResponse;
import com.cscs.digitalpricetag.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * POST /api/products
     *
     * Creates a new product in the Dragon ESL system.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> createProduct(@Valid @RequestBody ProductCreateRequest request) {
        productService.createProduct(request);
        return ResponseEntity.ok(ApiResponse.success("Product created successfully", null));
    }

    /**
     * GET /api/products?storeId=1001&page=0&size=10&barcode=xxx&search=milk
     *
     * storeId is REQUIRED — barcode is not unique across stores.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ProductResponse>>> getProducts(
            @RequestParam String storeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String barcode,
            @RequestParam(required = false) String search) {

        PagedResponse<ProductResponse> products =
                productService.getProducts(page, size, storeId, barcode, search);
        return ResponseEntity.ok(ApiResponse.success("Products fetched successfully", products));
    }

    /**
     * GET /api/products/{id}?storeId=1001
     *
     * {id} is Dragon internal item ID, not barcode.
     * storeId is REQUIRED.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(
            @PathVariable String id,
            @RequestParam String storeId) {

        ProductResponse product = productService.getProductById(id, storeId);
        return ResponseEntity.ok(ApiResponse.success("Product fetched successfully", product));
    }

    /**
     * PUT /api/products/{id}/price?storeId=1001
     *
     * {id} is Dragon internal item ID — obtained from GET /api/products list.
     * storeId is REQUIRED.
     *
     * CRITICAL: Frontend sends { "price": 75 }
     * Backend transforms internally to { "price": "75", "custFeature1": "75" }
     */
    @PutMapping("/{id}/price")
    public ResponseEntity<ApiResponse<Void>> updatePrice(
            @PathVariable String id,
            @RequestParam String storeId,
            @Valid @RequestBody PriceUpdateRequest request) {

        productService.updatePrice(id, request, storeId);
        return ResponseEntity.ok(ApiResponse.success("Price updated successfully", null));
    }

    /**
     * DELETE /api/products/{id}/store
     *
     * Store-specific delete — removes from ONE store only.
     * VERIFIED Dragon ESL endpoint: DELETE /zk/item/businessDeleteItem/{id}
     */
    @DeleteMapping("/{id}/store")
    public ResponseEntity<ApiResponse<Void>> deleteFromStore(@PathVariable String id) {

        productService.deleteFromStore(id);
        return ResponseEntity.ok(ApiResponse.success("Product removed from store", null));
    }

    /**
     * DELETE /api/products/{id}/global
     *
     * Global delete — removes from ALL stores.
     * VERIFIED Dragon ESL endpoint: DELETE /zk/item/deleteItem
     */
    @DeleteMapping("/{id}/global")
    public ResponseEntity<ApiResponse<Void>> deleteGlobal(@PathVariable String id) {

        productService.deleteGlobal(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted globally", null));
    }
}

