package com.snd.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DistributorRankDto {
    private Long distributorId;
    private String distributorName;
    private Long ordersCount;
    private Long cardsBought;
    private BigDecimal totalSpend;
    private BigDecimal currentBalance;
}
