package com.snd.util;

import org.springframework.stereotype.Component;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class CryptoUtil {
    private static final String AES_KEY_STRING = "VoIP-Snd-Secret-Key-2026-Security!"; // 32 chars = 256 bits
    private static final SecureRandom RANDOM = new SecureRandom();

    public static String hashPin(String pin) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(pin.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error hashing PIN", e);
        }
    }

    public static String encryptPin(String pin) {
        try {
            SecretKeySpec secretKey = new SecretKeySpec(AES_KEY_STRING.substring(0, 32).getBytes(StandardCharsets.UTF_8), "AES");
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] encrypted = cipher.doFinal(pin.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting PIN", e);
        }
    }

    public static String decryptPin(String encryptedPin) {
        try {
            SecretKeySpec secretKey = new SecretKeySpec(AES_KEY_STRING.substring(0, 32).getBytes(StandardCharsets.UTF_8), "AES");
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            byte[] decoded = Base64.getDecoder().decode(encryptedPin);
            return new String(cipher.doFinal(decoded), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "******";
        }
    }

    public static String maskPin(String pin) {
        if (pin == null || pin.length() < 4) return "•••• ••••";
        String last4 = pin.substring(pin.length() - 4);
        return "•••• •••• " + last4;
    }

    public static String generateNumericPin(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }

    public static String generateBatchSerialNumber(Long denominationValue, String batchTag, int index) {
        return String.format("SN-%d-%s-%04d", denominationValue, batchTag, index);
    }
}
