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
public class DenominationBreakdownDto {
    private Long denominationId;
    private String denominationName;
    private String denominationCode;
    private Long totalCards;
    private BigDecimal totalWholesaleCost;
    private BigDecimal totalFaceValue;
}
