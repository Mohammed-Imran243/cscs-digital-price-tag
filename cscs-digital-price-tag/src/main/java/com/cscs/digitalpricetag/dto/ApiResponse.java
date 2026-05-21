package com.cscs.digitalpricetag.dto;

import java.time.Instant;

public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private int status;
    private String timestamp;

    // ── Constructors ────────────────────────────────────────────────────────

    private ApiResponse() {}

    private ApiResponse(boolean success, String message, T data, int status) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.status = status;
        this.timestamp = Instant.now().toString();
    }

    // ── Static factory methods ──────────────────────────────────────────────

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "Success", data, 200);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data, 200);
    }

    public static <T> ApiResponse<T> error(String message, int status) {
        return new ApiResponse<>(false, message, null, status);
    }

    public static <T> ApiResponse<T> error(String message, T data, int status) {
        return new ApiResponse<>(false, message, data, status);
    }

    // ── Getters ─────────────────────────────────────────────────────────────

    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public T getData() { return data; }
    public int getStatus() { return status; }
    public String getTimestamp() { return timestamp; }

    // ── Setters ─────────────────────────────────────────────────────────────

    public void setSuccess(boolean success) { this.success = success; }
    public void setMessage(String message) { this.message = message; }
    public void setData(T data) { this.data = data; }
    public void setStatus(int status) { this.status = status; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}