package com.snd.dto.report;

import com.snd.dto.sales.SalesOrderResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialReportDto {
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal grossSales;
    private BigDecimal totalDiscounts;
    private BigDecimal netRevenue;
    private Long totalCardsDistributed;
    private Long totalOrders;
    private List<SalesOrderResponse> orders;
    private List<DistributorRankDto> distributorBreakdown;
}
