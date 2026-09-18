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
public class CampaignExpenseItemDto {
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
