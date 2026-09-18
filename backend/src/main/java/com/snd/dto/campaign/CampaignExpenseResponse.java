package com.snd.dto.campaign;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignExpenseResponse {
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
