package com.snd.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.*;

@DisplayName("MsisdnUtil")
class MsisdnUtilTest {
    @Test
    void normalize() {
    }

    // =========================================================================
    // normalize() -- happy paths
    // =========================================================================

    @Nested
    @DisplayName("normalize() - valid inputs")
    class Normalize_ValidInputs {

        @Test
        @DisplayName("already-correct 8801XXXXXXXXX is returned as-is")
        void alreadyNormalized() {
            assertThat(MsisdnUtil.normalize("8801712345678")).isEqualTo("8801712345678");
        }

        @Test
        @DisplayName("leading '+' is stripped")
        void plusPrefix() {
            assertThat(MsisdnUtil.normalize("+8801712345678")).isEqualTo("8801712345678");
        }

        @Test
        @DisplayName("IDD prefix '00' is stripped")
        void iddPrefix() {
            assertThat(MsisdnUtil.normalize("008801712345678")).isEqualTo("8801712345678");
        }

        @Test
        @DisplayName("local format '01XXXXXXXXX' gets '880' prepended")
        void localFormat() {
            assertThat(MsisdnUtil.normalize("01712345678")).isEqualTo("8801712345678");
        }

        @Test
        @DisplayName("bare operator format '1XXXXXXXXX' (10 digits) gets '8801' prepended")
        void bareOperatorFormat() {
            assertThat(MsisdnUtil.normalize("1712345678")).isEqualTo("8801712345678");
        }

        @ParameterizedTest(name = "operator digit in ''{0}'' is accepted")
        @ValueSource(strings = {
                "8801312345678",
                "8801412345678",
                "8801512345678",
                "8801612345678",
                "8801712345678",
                "8801812345678",
                "8801912345678",
        })
        @DisplayName("all valid Bangladeshi operator prefix digits (3-9) are accepted")
        void allValidOperatorDigits(String msisdn) {
            assertThat(MsisdnUtil.normalize(msisdn)).isEqualTo(msisdn);
        }

        @Test
        @DisplayName("spaces inside number are stripped before normalisation")
        void spacesAreStripped() {
            assertThat(MsisdnUtil.normalize("017 1234 5678")).isEqualTo("8801712345678");
        }

        @Test
        @DisplayName("dashes inside number are stripped")
        void dashesAreStripped() {
            assertThat(MsisdnUtil.normalize("017-123-45678")).isEqualTo("8801712345678");
        }

        @Test
        @DisplayName("parentheses inside number are stripped")
        void parenthesesAreStripped() {
            assertThat(MsisdnUtil.normalize("(8801)712345678")).isEqualTo("8801712345678");
        }

        @Test
        @DisplayName("combination of '+', spaces and dashes is handled")
        void combinedFormatting() {
            assertThat(MsisdnUtil.normalize("+880 17-123-45678")).isEqualTo("8801712345678");
        }
    }

    // =========================================================================
    // normalize() -- error paths
    // =========================================================================

    @Nested
    @DisplayName("normalize() - invalid inputs throw IllegalArgumentException")
    class Normalize_InvalidInputs {

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = { "   " })
        @DisplayName("null, empty, or blank input throws")
        void nullEmptyBlank(String input) {
            assertThatIllegalArgumentException()
                    .isThrownBy(() -> MsisdnUtil.normalize(input))
                    .withMessageContaining("must not be null or blank");
        }

        @Test
        @DisplayName("number that is too short throws")
        void tooShort() {
            assertThatIllegalArgumentException()
                    .isThrownBy(() -> MsisdnUtil.normalize("8801712"));
        }

        @Test
        @DisplayName("number that is too long throws")
        void tooLong() {
            assertThatIllegalArgumentException()
                    .isThrownBy(() -> MsisdnUtil.normalize("88017123456789"));
        }

        @Test
        @DisplayName("invalid operator digit '0' throws")
        void invalidOperatorDigit_zero() {
            assertThatIllegalArgumentException()
                    .isThrownBy(() -> MsisdnUtil.normalize("8801012345678"))
                    .withMessageContaining("Invalid Bangladeshi operator prefix digit");
        }

        @Test
        @DisplayName("invalid operator digit '1' throws")
        void invalidOperatorDigit_one() {
            assertThatIllegalArgumentException()
                    .isThrownBy(() -> MsisdnUtil.normalize("8801112345678"))
                    .withMessageContaining("Invalid Bangladeshi operator prefix digit");
        }

        @Test
        @DisplayName("invalid operator digit '2' throws")
        void invalidOperatorDigit_two() {
            assertThatIllegalArgumentException()
                    .isThrownBy(() -> MsisdnUtil.normalize("8801212345678"))
                    .withMessageContaining("Invalid Bangladeshi operator prefix digit");
        }

        @Test
        @DisplayName("completely unrecognised format throws")
        void unrecognisedFormat() {
            assertThatIllegalArgumentException()
                    .isThrownBy(() -> MsisdnUtil.normalize("12345"))
                    .withMessageContaining("Unrecognised");
        }

        @Test
        @DisplayName("non-BD country code throws")
        void nonBdCountryCode() {
            assertThatIllegalArgumentException()
                    .isThrownBy(() -> MsisdnUtil.normalize("+447712345678"));
        }

        @Test
        @DisplayName("letters in number throw")
        void lettersInNumber() {
            assertThatIllegalArgumentException()
                    .isThrownBy(() -> MsisdnUtil.normalize("0171234ABCD"));
        }
    }

    // =========================================================================
    // isNormalized()
    // =========================================================================

    @Nested
    @DisplayName("isNormalized()")
    class IsNormalized {

        @Test
        @DisplayName("returns true for a valid 8801XXXXXXXXX number")
        void trueForValid() {
            assertThat(MsisdnUtil.isNormalized("8801712345678")).isTrue();
        }

        @Test
        @DisplayName("returns false for local format '01XXXXXXXXX'")
        void falseForLocalFormat() {
            assertThat(MsisdnUtil.isNormalized("01712345678")).isFalse();
        }

        @Test
        @DisplayName("returns false for '+8801XXXXXXXXX'")
        void falseForPlusPrefix() {
            assertThat(MsisdnUtil.isNormalized("+8801712345678")).isFalse();
        }

        @Test
        @DisplayName("returns false for null")
        void falseForNull() {
            assertThat(MsisdnUtil.isNormalized(null)).isFalse();
        }

        @Test
        @DisplayName("returns false for empty string")
        void falseForEmpty() {
            assertThat(MsisdnUtil.isNormalized("")).isFalse();
        }
    }

    // =========================================================================
    // isValid() / normalizeOrNull()
    // =========================================================================

    @Nested
    @DisplayName("isValid() and normalizeOrNull()")
    class IsValid_NormalizeOrNull {

        @Test
        @DisplayName("isValid() returns true for a normalisable number")
        void isValidTrue() {
            assertThat(MsisdnUtil.isValid("01712345678")).isTrue();
        }

        @Test
        @DisplayName("isValid() returns false for garbage input")
        void isValidFalse() {
            assertThat(MsisdnUtil.isValid("not-a-number")).isFalse();
        }

        @Test
        @DisplayName("normalizeOrNull() returns null instead of throwing for invalid input")
        void normalizeOrNullReturnsNull() {
            assertThat(MsisdnUtil.normalizeOrNull("garbage")).isNull();
        }

        @Test
        @DisplayName("normalizeOrNull() returns normalised number for valid input")
        void normalizeOrNullReturnsValue() {
            assertThat(MsisdnUtil.normalizeOrNull("01712345678")).isEqualTo("8801712345678");
        }

        @Test
        @DisplayName("normalizeOrNull() returns null for null input without throwing")
        void normalizeOrNullWithNull() {
            assertThat(MsisdnUtil.normalizeOrNull(null)).isNull();
        }
    }
}