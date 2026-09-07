package com.snd.service;

import com.snd.dto.ReportDto;
import com.snd.dto.SalesDto;
import com.snd.model.CardDenomination;
import com.snd.model.SalesOrder;
import com.snd.model.User;
import com.snd.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final SalesOrderRepository orderRepository;
    private final CardDenominationRepository denominationRepository;
    private final RechargeCardRepository rechargeCardRepository;
    private final CardBatchRepository batchRepository;
    private final UserRepository userRepository;
    private final SalesService salesService;

    public ReportDto.DashboardSummaryDto getDashboardSummary() {
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();
        BigDecimal totalFaceValue = orderRepository.calculateTotalFaceValueSold();
        BigDecimal totalDiscounts = totalFaceValue.subtract(totalRevenue);
        Long totalCardsSold = orderRepository.calculateTotalCardsSold();
        long totalInStock = rechargeCardRepository.countByStatus("IN_STOCK");
        long totalBatches = batchRepository.count();
        long totalDistributors = userRepository.findByRole("DISTRIBUTOR").size();

        List<CardDenomination> activeDenoms = denominationRepository.findByIsActiveTrue();
        long lowStockCount = activeDenoms.stream()
                .filter(d -> rechargeCardRepository.countByDenominationIdAndStatus(d.getId(), "IN_STOCK") < 20)
                .count();

        List<ReportDto.MonthlySalesTrend> trends = buildMonthlyTrends();
        List<ReportDto.DenominationSalesShare> denominationShares = buildDenominationShares(totalFaceValue);
        List<ReportDto.DistributorRankDto> topDistributors = buildTopDistributors();

        List<SalesDto.SalesOrderResponse> recentOrders = orderRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5))
                .getContent().stream()
                .map(o -> salesService.getOrderById(o.getId()))
                .collect(Collectors.toList());

        return ReportDto.DashboardSummaryDto.builder()
                .totalRevenue(totalRevenue)
                .totalFaceValueSold(totalFaceValue)
                .totalDiscountsGiven(totalDiscounts.compareTo(BigDecimal.ZERO) > 0 ? totalDiscounts : BigDecimal.ZERO)
                .totalCardsSold(totalCardsSold)
                .totalCardsInStock(totalInStock)
                .totalBatches(totalBatches)
                .totalDistributors(totalDistributors)
                .lowStockAlertsCount(lowStockCount)
                .monthlyTrends(trends)
                .denominationShares(denominationShares)
                .topDistributors(topDistributors)
                .recentOrders(recentOrders)
                .build();
    }

    public ReportDto.FinancialReportDto getFinancialReport(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : LocalDateTime.now().minusDays(30);
        LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : LocalDateTime.now();

        List<SalesOrder> orders = orderRepository.filterOrders(null, null, null, start, end, null, PageRequest.of(0, 1000)).getContent();

        BigDecimal grossSales = orders.stream().map(SalesOrder::getTotalFaceValue).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDiscounts = orders.stream().map(SalesOrder::getDiscountAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal netRevenue = orders.stream().map(SalesOrder::getFinalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        long totalCards = orders.stream().mapToLong(SalesOrder::getTotalCardsCount).sum();

        List<SalesDto.SalesOrderResponse> orderResponses = orders.stream()
                .map(o -> salesService.getOrderById(o.getId()))
                .collect(Collectors.toList());

        List<ReportDto.DistributorRankDto> distributorBreakdown = buildTopDistributors();

        return ReportDto.FinancialReportDto.builder()
                .startDate(start.toLocalDate())
                .endDate(end.toLocalDate())
                .grossSales(grossSales)
                .totalDiscounts(totalDiscounts)
                .netRevenue(netRevenue)
                .totalCardsDistributed(totalCards)
                .totalOrders((long) orders.size())
                .orders(orderResponses)
                .distributorBreakdown(distributorBreakdown)
                .build();
    }

    private List<ReportDto.MonthlySalesTrend> buildMonthlyTrends() {
        List<ReportDto.MonthlySalesTrend> list = new ArrayList<>();
        LocalDate now = LocalDate.now();

        for (int i = 5; i >= 0; i--) {
            LocalDate monthDate = now.minusMonths(i);
            LocalDateTime monthStart = monthDate.withDayOfMonth(1).atStartOfDay();
            LocalDateTime monthEnd = monthDate.withDayOfMonth(monthDate.lengthOfMonth()).atTime(23, 59, 59);

            List<SalesOrder> orders = orderRepository.filterOrders(null, null, null, monthStart, monthEnd, null, PageRequest.of(0, 10000)).getContent();

            BigDecimal revenue = orders.stream().map(SalesOrder::getFinalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal faceValue = orders.stream().map(SalesOrder::getTotalFaceValue).reduce(BigDecimal.ZERO, BigDecimal::add);
            long cardsCount = orders.stream().mapToLong(SalesOrder::getTotalCardsCount).sum();

            String period = monthDate.format(DateTimeFormatter.ofPattern("MMM yyyy"));

            list.add(ReportDto.MonthlySalesTrend.builder()
                    .period(period)
                    .revenue(revenue)
                    .faceValue(faceValue)
                    .cardsCount(cardsCount)
                    .build());
        }
        return list;
    }

    private List<ReportDto.DenominationSalesShare> buildDenominationShares(BigDecimal totalFaceValue) {
        List<CardDenomination> denominations = denominationRepository.findAll();
        List<ReportDto.DenominationSalesShare> list = new ArrayList<>();

        for (CardDenomination d : denominations) {
            long soldCount = rechargeCardRepository.countByDenominationIdAndStatus(d.getId(), "SOLD") +
                    rechargeCardRepository.countByDenominationIdAndStatus(d.getId(), "REDEEMED");
            BigDecimal denomRevenue = d.getFaceValue().multiply(BigDecimal.valueOf(soldCount));
            double percentage = totalFaceValue.compareTo(BigDecimal.ZERO) > 0
                    ? denomRevenue.divide(totalFaceValue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;

            list.add(ReportDto.DenominationSalesShare.builder()
                    .denominationId(d.getId())
                    .denominationName(d.getName())
                    .faceValue(d.getFaceValue())
                    .quantitySold(soldCount)
                    .revenue(denomRevenue)
                    .percentage(percentage)
                    .build());
        }
        return list;
    }

    private List<ReportDto.DistributorRankDto> buildTopDistributors() {
        List<User> distributors = userRepository.findByRole("DISTRIBUTOR");
        List<ReportDto.DistributorRankDto> list = new ArrayList<>();

        for (User dist : distributors) {
            List<SalesOrder> orders = orderRepository.findByDistributorIdOrderByCreatedAtDesc(dist.getId());
            long cardsBought = orders.stream().mapToLong(SalesOrder::getTotalCardsCount).sum();
            BigDecimal totalSpend = orders.stream().map(SalesOrder::getFinalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

            list.add(ReportDto.DistributorRankDto.builder()
                    .distributorId(dist.getId())
                    .distributorName(dist.getFullName())
                    .ordersCount((long) orders.size())
                    .cardsBought(cardsBought)
                    .totalSpend(totalSpend)
                    .currentBalance(dist.getBalance())
                    .build());
        }

        list.sort(Comparator.comparing(ReportDto.DistributorRankDto::getTotalSpend).reversed());
        return list;
    }
}