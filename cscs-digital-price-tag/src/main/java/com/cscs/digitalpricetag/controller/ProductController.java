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
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/products")
@PreAuthorize("hasAuthority('product')")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> createProduct(@Valid @RequestBody ProductCreateRequest request) {
        productService.createProduct(request);
        return ResponseEntity.ok(ApiResponse.success("Product created successfully", null));
    }

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

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(
            @PathVariable String id,
            @RequestParam String storeId) {

        ProductResponse product = productService.getProductById(id, storeId);
        return ResponseEntity.ok(ApiResponse.success("Product fetched successfully", product));
    }

    @PutMapping("/{id}/price")
    public ResponseEntity<ApiResponse<Void>> updatePrice(
            @PathVariable String id,
            @RequestParam String storeId,
            @Valid @RequestBody PriceUpdateRequest request) {

        productService.updatePrice(id, request, storeId);
        return ResponseEntity.ok(ApiResponse.success("Price updated successfully", null));
    }

    @DeleteMapping("/{id}/store")
    public ResponseEntity<ApiResponse<Void>> deleteFromStore(
            @PathVariable String id,
            @RequestParam String storeId,
            @RequestParam String barcode) {

        productService.deleteFromStore(id, storeId, barcode);
        return ResponseEntity.ok(ApiResponse.success("Product removed from store", null));
    }

    /**
     * DELETE /api/products/{id}/global?barcode=xxx
     * barcode is REQUIRED — DragonESL batchDeleteItem needs the barcode not internal ID
     */
    @DeleteMapping("/{id}/global")
    public ResponseEntity<ApiResponse<Void>> deleteGlobal(
            @PathVariable String id,
            @RequestParam String barcode) {

        productService.deleteGlobal(id,barcode);
        return ResponseEntity.ok(ApiResponse.success("Product deleted globally", null));
    }
}