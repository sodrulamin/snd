package com.snd.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class VoipDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoipRedeemRequest {
        @NotBlank(message = "Card PIN is required")
        private String pin;

        private String serialNumber;

        @NotBlank(message = "VoIP Subscriber number is required")
        private String subscriberNumber;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoipRedeemResponse {
        private boolean success;
        private String message;
        private String serialNumber;
        private BigDecimal faceValue;
        private String currency;
        private String subscriberNumber;
        private LocalDateTime redeemedAt;
        private String transactionReference;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoipLogDto {
        private Long id;
        private String serialNumber;
        private Long distributorId;
        private String subscriberVoipNumber;
        private BigDecimal faceValue;
        private String status;
        private String failureReason;
        private String ipAddress;
        private LocalDateTime redeemedAt;
    }
}