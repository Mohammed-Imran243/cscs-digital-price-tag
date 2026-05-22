package com.cscs.digitalpricetag.exception;

import org.springframework.http.HttpStatus;

public class DragonEslException extends RuntimeException {

    private final int httpStatus;
    private final String dragonErrorCode;

    // ── int-based constructors ───────────────────────────────────────────────

    public DragonEslException(String message) {
        super(message);
        this.httpStatus = 502;
        this.dragonErrorCode = null;
    }

    public DragonEslException(String message, int httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
        this.dragonErrorCode = null;
    }

    public DragonEslException(String message, int httpStatus, String dragonErrorCode) {
        super(message);
        this.httpStatus = httpStatus;
        this.dragonErrorCode = dragonErrorCode;
    }

    public DragonEslException(String message, int httpStatus, Throwable cause) {
        super(message, cause);
        this.httpStatus = httpStatus;
        this.dragonErrorCode = null;
    }

    public DragonEslException(String message, Throwable cause) {
        super(message, cause);
        this.httpStatus = 502;
        this.dragonErrorCode = null;
    }

    // ── HttpStatus-based constructors (used by DragonAuthService) ────────────

    public DragonEslException(String message, HttpStatus httpStatus) {
        super(message);
        this.httpStatus = httpStatus.value();
        this.dragonErrorCode = null;
    }

    public DragonEslException(String message, HttpStatus httpStatus, String dragonErrorCode) {
        super(message);
        this.httpStatus = httpStatus.value();
        this.dragonErrorCode = dragonErrorCode;
    }

    public DragonEslException(String message, HttpStatus httpStatus, Throwable cause) {
        super(message, cause);
        this.httpStatus = httpStatus.value();
        this.dragonErrorCode = null;
    }

    // ── Getters ─────────────────────────────────────────────────────────────

    public int getHttpStatus() {
        return httpStatus;
    }

    public String getDragonErrorCode() {
        return dragonErrorCode;
    }
}