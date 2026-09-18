package com.snd.dto.report;

import com.snd.dto.sales.SalesOrderResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDto {
    private BigDecimal totalRevenue;
    private BigDecimal lastMonthRevenue;
    private Double revenueGrowthPercentage;
    private BigDecimal totalFaceValueSold;
    private BigDecimal totalDiscountsGiven;
    private Long totalCardsSold;
    private Long totalCardsInStock;
    private Long totalBatches;
    private Long totalDistributors;
    private Long lowStockAlertsCount;
    private List<MonthlySalesTrend> monthlyTrends;
    private List<DenominationSalesShare> denominationShares;
    private List<DistributorRankDto> topDistributors;
    private List<SalesOrderResponse> recentOrders;
}
