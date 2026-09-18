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
public class DenominationSalesShare {
    private Long denominationId;
    private String denominationName;
    private BigDecimal faceValue;
    private Long quantitySold;
    private BigDecimal revenue;
    private Double percentage;
}
