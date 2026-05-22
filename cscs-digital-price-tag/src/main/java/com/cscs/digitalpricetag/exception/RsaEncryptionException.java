package com.cscs.digitalpricetag.exception;

/**
 * Thrown when RSA encryption of the Dragon ESL password fails.
 * Wraps underlying cryptographic exceptions with a meaningful message.
 */
public class RsaEncryptionException extends RuntimeException {

    public RsaEncryptionException(String message) {
        super(message);
    }

    public RsaEncryptionException(String message, Throwable cause) {
        super(message, cause);
    }
}