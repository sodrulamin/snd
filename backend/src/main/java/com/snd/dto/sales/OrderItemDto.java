package com.snd.dto.sales;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDto {
    private Long id;
    private Long denominationId;
    private String denominationName;
    private String denominationCode;
    private BigDecimal unitFaceValue;
    private Long batchId;
    private String batchNumber;
    private String startSerialNumber;
    private String endSerialNumber;
    private String serialRange;
    private Integer quantity;
    private BigDecimal subtotalFaceValue;
    private BigDecimal itemDiscountPercent;
    private BigDecimal subtotalFinal;
}
