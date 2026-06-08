package com.cscs.digitalpricetag.exception;

import com.cscs.digitalpricetag.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── Dragon ESL Errors ────────────────────────────────────────────────────

    @ExceptionHandler(DragonEslException.class)
    public ResponseEntity<ApiResponse<Void>> handleDragonEslException(DragonEslException ex) {
        int originalStatus = ex.getHttpStatus();
        return ResponseEntity
                .status(originalStatus)
                .body(ApiResponse.error(ex.getMessage(), originalStatus));
    }

    @ExceptionHandler(DragonImageValidationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDragonImageValidationException(DragonImageValidationException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Image Validation Error: " + ex.getMessage(), 400));
    }

    @ExceptionHandler(DragonImageNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleDragonImageNotFoundException(DragonImageNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Image Not Found: " + ex.getMessage(), 404));
    }

    @ExceptionHandler(DragonImageFetchException.class)
    public ResponseEntity<ApiResponse<Void>> handleDragonImageFetchException(DragonImageFetchException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_GATEWAY)
                .body(ApiResponse.error("Image Fetch Error: " + ex.getMessage(), 502));
    }

    // ── RSA Encryption Errors ─────────────────────────────────────────────────

    @ExceptionHandler(RsaEncryptionException.class)
    public ResponseEntity<ApiResponse<Void>> handleRsaEncryptionException(RsaEncryptionException ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Encryption error: " + ex.getMessage(), 500));
    }

    // ── Validation Errors ─────────────────────────────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
            MethodArgumentNotValidException ex
    ) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Validation failed", fieldErrors, 400));
    }

    // ── Illegal Argument ──────────────────────────────────────────────────────

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(
            IllegalArgumentException ex
    ) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage(), 400));
    }

    // ── Timeout & Connectivity Errors ─────────────────────────────────────────

    @ExceptionHandler({
            java.util.concurrent.TimeoutException.class,
            java.net.SocketTimeoutException.class
    })
    public ResponseEntity<ApiResponse<Void>> handleTimeoutException(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.GATEWAY_TIMEOUT)
                .body(ApiResponse.error("Request to downstream service timed out: " + ex.getMessage(), 504));
    }

    @ExceptionHandler(org.springframework.web.reactive.function.client.WebClientRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleWebClientException(org.springframework.web.reactive.function.client.WebClientRequestException ex) {
        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.error("Downstream service is unreachable: " + ex.getMessage(), 503));
    }

    // ── Catch-all ─────────────────────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        ex.printStackTrace(); // Log stack trace to console
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred", 500));
    }
}