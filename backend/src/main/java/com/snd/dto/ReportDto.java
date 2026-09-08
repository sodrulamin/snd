package com.snd.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class ReportDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardSummaryDto {
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
        private List<SalesDto.SalesOrderResponse> recentOrders;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlySalesTrend {
        private String period;
        private BigDecimal revenue;
        private BigDecimal faceValue;
        private Long cardsCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DenominationSalesShare {
        private Long denominationId;
        private String denominationName;
        private BigDecimal faceValue;
        private Long quantitySold;
        private BigDecimal revenue;
        private Double percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DistributorRankDto {
        private Long distributorId;
        private String distributorName;
        private Long ordersCount;
        private Long cardsBought;
        private BigDecimal totalSpend;
        private BigDecimal currentBalance;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinancialReportDto {
        private LocalDate startDate;
        private LocalDate endDate;
        private BigDecimal grossSales;
        private BigDecimal totalDiscounts;
        private BigDecimal netRevenue;
        private Long totalCardsDistributed;
        private Long totalOrders;
        private List<SalesDto.SalesOrderResponse> orders;
        private List<DistributorRankDto> distributorBreakdown;
    }
}