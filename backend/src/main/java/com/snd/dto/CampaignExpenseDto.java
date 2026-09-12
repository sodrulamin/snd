package com.snd.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class CampaignExpenseDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CampaignExpenseItemRequest {
        @NotNull(message = "Card product (Denomination ID) is required")
        private Long denominationId;

        @NotBlank(message = "Start serial number is required")
        private String startSerialNumber;

        @NotBlank(message = "End serial number is required")
        private String endSerialNumber;

        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateCampaignExpenseRequest {
        @NotBlank(message = "Campaign / Purpose name is required")
        private String campaignName;

        @NotBlank(message = "Purpose category is required (CAMPAIGN, INTERNAL_USE, etc.)")
        private String purposeCategory;

        @NotNull(message = "Campaign start date is required")
        private LocalDate startDate;

        @NotNull(message = "Campaign end date is required")
        private LocalDate endDate;

        private String referenceNo;

        private String beneficiaryDept;

        private LocalDateTime disbursedAt;

        private String notes;

        private List<CampaignExpenseItemRequest> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddExpenseItemsRequest {
        @NotEmpty(message = "At least one card range must be added")
        private List<CampaignExpenseItemRequest> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateCampaignRequest {
        @NotBlank(message = "Campaign / Purpose name is required")
        private String campaignName;

        @NotBlank(message = "Purpose category is required (CAMPAIGN, INTERNAL_USE, etc.)")
        private String purposeCategory;

        @NotNull(message = "Campaign start date is required")
        private LocalDate startDate;

        @NotNull(message = "Campaign end date is required")
        private LocalDate endDate;

        private String beneficiaryDept;

        private LocalDateTime disbursedAt;

        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CampaignExpenseItemDto {
        private Long id;
        private Long denominationId;
        private String denominationName;
        private String denominationCode;
        private Long batchId;
        private String batchNumber;
        private String startSerialNumber;
        private String endSerialNumber;
        private Integer quantity;
        private BigDecimal unitWholesalePrice;
        private BigDecimal unitFaceValue;
        private BigDecimal subtotalWholesaleCost;
        private BigDecimal subtotalFaceValue;
        private BigDecimal subtotalVariance;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CampaignExpenseResponse {
        private Long id;
        private String referenceNo;
        private String campaignName;
        private String purposeCategory;
        private LocalDate startDate;
        private LocalDate endDate;
        private String beneficiaryDept;
        private Integer totalCardsCount;
        private BigDecimal totalWholesaleCost;
        private BigDecimal totalFaceValue;
        private BigDecimal costVarianceAmount;
        private LocalDateTime disbursedAt;
        private String disbursedBy;
        private String notes;
        private String serialRangesSummary;
        private List<CampaignExpenseItemDto> items;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryBreakdownDto {
        private String category;
        private Long count;
        private Long totalCards;
        private BigDecimal totalWholesaleCost;
        private BigDecimal totalFaceValue;
        private Double percentageOfTotalCost;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DenominationBreakdownDto {
        private Long denominationId;
        private String denominationName;
        private String denominationCode;
        private Long totalCards;
        private BigDecimal totalWholesaleCost;
        private BigDecimal totalFaceValue;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CampaignCalculationSummaryDto {
        private Long totalCampaigns;
        private Long totalCardsSpent;
        private BigDecimal totalWholesaleCost;
        private BigDecimal totalFaceValue;
        private BigDecimal totalVariance;
        private BigDecimal averageCostPerCard;
        private List<CategoryBreakdownDto> categoryBreakdowns;
        private List<DenominationBreakdownDto> denominationBreakdowns;
    }
}
