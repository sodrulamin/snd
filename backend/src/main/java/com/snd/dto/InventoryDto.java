package com.snd.dto;

import com.snd.enums.BatchStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class InventoryDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchGenerateRequest {
        @NotNull(message = "Card product (Denomination ID) is required")
        private Long denominationId;

        private Integer quantity;

        private String startSerialNumber;
        private String endSerialNumber;

        private LocalDate availableUntil;
        private LocalDate expiryDate;
        private Integer validityDays;

        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchSummaryDto {
        private Long id;
        private String batchNumber;
        private Long denominationId;
        private String denominationCode;
        private String denominationName;
        private BigDecimal faceValue;
        private BigDecimal retailPrice;
        private BigDecimal wholesalePrice;
        private String currency;
        private Integer quantity;
        private String startSerialNumber;
        private String endSerialNumber;
        private Integer inStockCount;
        private Integer soldCount;
        private BigDecimal totalFaceValue;
        private BatchStatus status;
        private LocalDateTime generatedAt;
        private LocalDate expiryDate;
        private String notes;
        private String createdBy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CardDetailDto {
        private Long id;
        private Long batchId;
        private String batchNumber;
        private Long denominationId;
        private String denominationCode;
        private String denominationName;
        private BigDecimal faceValue;
        private BigDecimal retailPrice;
        private BigDecimal wholesalePrice;
        private String currency;
        private String serialNumber;
        private String pinMasked;
        private String pinPlain;
        private String status;
        private Long distributorId;
        private String distributorName;
        private Long orderId;
        private String orderNumber;
        private LocalDateTime soldAt;
        private LocalDateTime redeemedAt;
        private LocalDate expiryDate;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DenominationRequest {
        @NotBlank(message = "Card unique code is required")
        private String code;

        @NotBlank(message = "Card name is required")
        private String name;

        @NotNull(message = "Retailer price is required")
        private BigDecimal retailPrice;

        @NotNull(message = "Wholesale price is required")
        private BigDecimal wholesalePrice;

        @NotNull(message = "Available from date is required")
        private LocalDate availableFrom;

        @NotNull(message = "Available until date is required")
        private LocalDate availableUntil;

        private BigDecimal faceValue;

        @Builder.Default
        private String currency = "BDT";

        private Integer validityDays;

        private String description;

        @Builder.Default
        private Boolean isActive = true;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DenominationResponse {
        private Long id;
        private String code;
        private String name;
        private BigDecimal retailPrice;
        private BigDecimal wholesalePrice;
        private BigDecimal faceValue;
        private LocalDate availableFrom;
        private LocalDate availableUntil;
        private String currency;
        private Integer validityDays;
        private String description;
        private Boolean isActive;
        private Long availableStock;
        private Long totalCardsGenerated;
        private Long totalCardsSold;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailableSerialRangeResponse {
        private Long denominationId;
        private String denominationName;
        private boolean available;
        private String startSerialNumber;
        private String endSerialNumber;
        private Integer availableCount;
        private String batchNumber;
    }
}
