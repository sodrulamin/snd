package com.snd.dto.campaign;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryBreakdownDto {
    private String category;
    private Long count;
    private Long totalCards;
    private BigDecimal totalWholesaleCost;
    private BigDecimal totalFaceValue;
    private Double percentageOfTotalCost;
}
