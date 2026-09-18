package com.snd.dto.campaign;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignCalculationSummaryDto {
    private Long totalCampaigns;
    private Long totalCardsSpent;
    private BigDecimal totalWholesaleCost;
    private BigDecimal totalFaceValue;
    private BigDecimal totalVariance;
    private BigDecimal averageCostPerCard;
    private List<CategoryBreakdownDto> categoryBreakdowns;
    private List<DenominationBreakdownDto> denominationBreakdowns;
}
