package com.snd.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Utility class for normalising Bangladeshi MSISDNs (Mobile Station
 * International Subscriber Directory Numbers) to the full international
 * format required by the SMS gateway: {@code 8801XXXXXXXXX} (13 digits).
 *
 * <h3>Accepted input formats (all normalised to {@code 8801XXXXXXXXX}):</h3>
 * <pre>
 *   8801XXXXXXXXX   - already correct, returned as-is
 *   +8801XXXXXXXXX  - leading '+' stripped
 *   008801XXXXXXXXX - IDD prefix '00' stripped
 *   01XXXXXXXXX     - local format, country code '880' prepended
 *   1XXXXXXXXX      - bare operator prefix, '8801' prepended
 * </pre>
 *
 * <h3>Validation rules:</h3>
 * <ul>
 *   <li>After normalisation the result must be exactly 13 digits.</li>
 *   <li>The operator prefix digit (5th character, index 4) must be one of:
 *       3, 4, 5, 6, 7, 8, 9 (valid Bangladeshi mobile operators).</li>
 * </ul>
 */
@Component
@Slf4j
public class MsisdnUtil {

    private static final String BD_CODE_88 = "88";
    private static final String BD_CODE_880 = "880";
    private static final String BD_CODE_8801 = "8801";
    private static final int BD_MSISDN_LENGTH = 13; // 8801XXXXXXXXX

    // Valid operator prefix digits (the digit after '8801')
    private static final String VALID_OPERATOR_DIGITS = "3456789";

    private MsisdnUtil() { /* static utility class */ }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Normalises {@code number} to the full Bangladeshi international format
     * {@code 8801XXXXXXXXX}.
     *
     * @param number raw phone number in any supported format
     * @return normalised 13-digit MSISDN string
     * @throws IllegalArgumentException if the number is null, blank, or cannot
     *                                  be mapped to a valid Bangladeshi MSISDN
     */
    public static String normalize(String number) {
        if (number == null || number.isBlank()) {
            throw new IllegalArgumentException("Phone number must not be null or blank");
        }

        // 1. Strip whitespace, dashes, parentheses, and plus signs.
        String digits = number.replaceAll("[\\s\\-().+]", "");
        if (!digits.matches("\\d+")) {
            throw new IllegalArgumentException("Phone '" + number + "' number contains non-numeric characters");
        }

        // 2. Remove IDD prefix '00' if present before country code.
        if (digits.startsWith("00")) {
            digits = digits.substring(2);
        }

        // 3. Map to the full international format.
        if (digits.startsWith(BD_CODE_8801)) {
            log.debug("Number: {} is already normalized", number);
            // Already in correct format: 8801XXXXXXXXX
        }
        else if (digits.startsWith(BD_CODE_880)) {
            // Starts with 880 but the next char is not '1'
            if (!digits.substring(BD_CODE_880.length()).startsWith("1")) {
                throw new IllegalArgumentException(
                        "Number starts with 880 but is not a mobile number: " + number);
            }
            // Otherwise digits is already 8801XXXXXXXXX (covered above)
        }
        else if (digits.startsWith("01")) {
            // Local format: 01XXXXXXXXX  ->  8801XXXXXXXXX
            digits = BD_CODE_88 + digits;
        }
        else if (digits.startsWith("1") && digits.length() == 10) {
            // Bare operator number: 1XXXXXXXXX  ->  8801XXXXXXXXX
            digits = BD_CODE_880 + digits;
        }
        else {
            throw new IllegalArgumentException("Unrecognised Bangladeshi number format: " + number);
        }

        // 4. Validate final length.
        if (digits.length() != BD_MSISDN_LENGTH) {
            throw new IllegalArgumentException(
                    "Normalised MSISDN must be " + BD_MSISDN_LENGTH + " digits, got " +
                            digits.length() + " for input: " + number);
        }

        // 5. Validate operator prefix digit (index 4, after '8801').
        char operatorDigit = digits.charAt(4);
        if (VALID_OPERATOR_DIGITS.indexOf(operatorDigit) < 0) {
            throw new IllegalArgumentException(
                    "Invalid Bangladeshi operator prefix digit '" + operatorDigit +
                            "' in number: " + number);
        }

        return digits;
    }

    /**
     * Returns {@code true} if {@code number} is already in the correct
     * {@code 8801XXXXXXXXX} format without any modification needed.
     *
     * @param number phone number to check
     * @return {@code true} if already normalised
     */
    public static boolean isNormalized(String number) {
        if (number == null) return false;
        return number.matches("^8801[3-9]\\d{8}$");
    }

    /**
     * Attempts to normalise {@code number}; returns {@code null} if the input
     * cannot be converted (instead of throwing).
     *
     * @param number raw phone number
     * @return normalised MSISDN, or {@code null} if invalid
     */
    public static String normalizeOrNull(String number) {
        try {
            return normalize(number);
        }
        catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * Validates that {@code number} can be successfully normalised to a valid
     * Bangladeshi MSISDN.
     *
     * @param number phone number to validate
     * @return {@code true} if valid (normalisable)
     */
    public static boolean isValid(String number) {
        return normalizeOrNull(number) != null;
    }
}