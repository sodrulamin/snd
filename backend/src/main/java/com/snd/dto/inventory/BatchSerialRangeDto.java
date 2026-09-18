package com.snd.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchSerialRangeDto {
    private Long batchId;
    private String batchNumber;
    private Long denominationId;
    private String denominationCode;
    private String denominationName;
    private String startSerialNumber;
    private String endSerialNumber;
    private Integer quantity;
    private String status; // IN_STOCK, SOLD, ALLOCATED
    private Long distributorId;
    private String distributorName;
    private Long orderId;
    private String orderNumber;
    private BigDecimal unitWholesalePrice;
    private BigDecimal totalWholesalePrice;
    private BigDecimal unitRetailPrice;
    private BigDecimal totalRetailPrice;
}
