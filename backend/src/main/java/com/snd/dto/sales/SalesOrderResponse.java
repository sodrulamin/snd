package com.snd.dto.sales;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrderResponse {
    private Long id;
    private String orderNumber;
    private Long distributorId;
    private String distributorName;
    private String distributorEmail;
    private String distributorPhone;
    private Integer totalCardsCount;
    private BigDecimal totalFaceValue;
    private BigDecimal discountPercentage;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String paymentMethod;
    private String paymentStatus;
    private String orderStatus;
    private String notes;
    private String serialRangesSummary;
    private String createdBy;
    private LocalDateTime createdAt;
    private List<OrderItemDto> items;
}
