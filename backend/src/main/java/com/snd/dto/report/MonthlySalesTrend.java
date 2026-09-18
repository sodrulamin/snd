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
public class MonthlySalesTrend {
    private String period;
    private BigDecimal revenue;
    private BigDecimal faceValue;
    private Long cardsCount;
}
