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
public class InventorySummaryDto {
    private long totalLots;
    private long inStockCards;
    private BigDecimal totalWholesaleValue;
    private BigDecimal totalRetailValue;
}
