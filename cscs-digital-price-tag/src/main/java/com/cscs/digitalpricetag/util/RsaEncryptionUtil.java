package com.cscs.digitalpricetag.util;

import com.cscs.digitalpricetag.exception.RsaEncryptionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.Cipher;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

/**
 * RSA encryption utility using RSAES-PKCS1-V1_5 padding.
 *
 * Dragon ESL requires the login password to be:
 *   1. Encrypted with the server's RSA public key using PKCS#1 v1.5 padding
 *   2. Base64-encoded (standard, not URL-safe)
 *
 * The public key returned by Dragon ESL is Base64-encoded DER
 * in X.509 SubjectPublicKeyInfo format (usable directly with X509EncodedKeySpec).
 */
public final class RsaEncryptionUtil {

    private static final Logger log = LoggerFactory.getLogger(RsaEncryptionUtil.class);

    // RSAES-PKCS1-V1_5 — required by Dragon ESL
    private static final String RSA_ALGORITHM       = "RSA";
    private static final String RSA_CIPHER_PADDING  = "RSA/ECB/PKCS1Padding";

    // Utility class — no instantiation
    private RsaEncryptionUtil() {}

    /**
     * Encrypts {@code plaintext} using RSAES-PKCS1-V1_5 with the provided public key.
     *
     * @param plaintext        the raw password string
     * @param base64PublicKey  Base64-encoded DER public key as returned by Dragon ESL
     * @return Base64-encoded ciphertext, ready to send as {@code loginPassword}
     * @throws RsaEncryptionException if key parsing or encryption fails
     */
    public static String encrypt(String plaintext, String base64PublicKey) {
        try {
            log.debug("RSA encrypt: decoding public key ({} chars)", base64PublicKey.length());

            // 1. Decode the Base64 DER public key
            byte[] keyBytes = Base64.getDecoder().decode(base64PublicKey.trim());

            // 2. Reconstruct the RSA PublicKey object
            X509EncodedKeySpec keySpec  = new X509EncodedKeySpec(keyBytes);
            KeyFactory         factory  = KeyFactory.getInstance(RSA_ALGORITHM);
            PublicKey          publicKey = factory.generatePublic(keySpec);

            // 3. Encrypt with PKCS#1 v1.5 padding
            Cipher cipher = Cipher.getInstance(RSA_CIPHER_PADDING);
            cipher.init(Cipher.ENCRYPT_MODE, publicKey);
            byte[] encryptedBytes = cipher.doFinal(plaintext.getBytes(java.nio.charset.StandardCharsets.UTF_8));

            // 4. Return as standard Base64 string
            String result = Base64.getEncoder().encodeToString(encryptedBytes);
            log.debug("RSA encrypt: success, ciphertext length={}", result.length());
            return result;

        } catch (IllegalArgumentException e) {
            throw new RsaEncryptionException(
                    "Failed to decode Dragon ESL public key — invalid Base64: " + e.getMessage(), e);
        } catch (java.security.spec.InvalidKeySpecException e) {
            throw new RsaEncryptionException(
                    "Dragon ESL public key is not a valid X.509 RSA key: " + e.getMessage(), e);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RsaEncryptionException(
                    "RSA algorithm not available in this JVM: " + e.getMessage(), e);
        } catch (javax.crypto.NoSuchPaddingException e) {
            throw new RsaEncryptionException(
                    "PKCS1Padding not available: " + e.getMessage(), e);
        } catch (java.security.InvalidKeyException e) {
            throw new RsaEncryptionException(
                    "Invalid RSA public key during cipher init: " + e.getMessage(), e);
        } catch (javax.crypto.IllegalBlockSizeException | javax.crypto.BadPaddingException e) {
            throw new RsaEncryptionException(
                    "RSA encryption failed — block/padding error: " + e.getMessage(), e);
        }
    }
}