package com.snd.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class DistributorDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DistributorRequest {
        @NotBlank(message = "Username is required")
        private String username;

        private String password;

        @NotBlank(message = "Full name / Company name is required")
        private String fullName;

        private String email;
        private String phone;
        @Builder.Default
        private BigDecimal creditLimit = BigDecimal.ZERO;
        @Builder.Default
        private BigDecimal discountRate = BigDecimal.ZERO;
        private String address;
        @Builder.Default
        private String status = "ACTIVE";
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DistributorResponse {
        private Long id;
        private String username;
        private String fullName;
        private String email;
        private String phone;
        private String status;
        private BigDecimal balance;
        private BigDecimal creditLimit;
        private BigDecimal availableCredit;
        private BigDecimal discountRate;
        private String address;
        private Long totalOrdersCount;
        private BigDecimal totalPurchasesAmount;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WalletTopUpRequest {
        @NotNull(message = "Distributor ID is required")
        private Long distributorId;

        @NotNull(message = "Amount is required")
        private BigDecimal amount;

        @Builder.Default
        private String transactionType = "CREDIT";

        @Builder.Default
        private String referenceType = "BANK_TRANSFER";

        private String referenceId;

        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionDto {
        private Long id;
        private Long distributorId;
        private String distributorName;
        private String transactionType;
        private BigDecimal amount;
        private BigDecimal previousBalance;
        private BigDecimal newBalance;
        private String referenceType;
        private String referenceId;
        private String notes;
        private LocalDateTime createdAt;
    }
}