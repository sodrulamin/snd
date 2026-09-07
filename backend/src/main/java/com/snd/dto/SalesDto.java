package com.snd.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class SalesDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemRequest {
        @NotNull(message = "Card product (Denomination ID) is required")
        private Long denominationId;

        private Long batchId;

        private String startSerialNumber;
        private String endSerialNumber;

        private Integer quantity;

        private BigDecimal itemDiscountPercent;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateOrderRequest {
        @NotNull(message = "Distributor ID is required")
        private Long distributorId;

        @NotEmpty(message = "Order must contain at least one item")
        private List<OrderItemRequest> items;

        private BigDecimal customDiscountPercentage;

        @Builder.Default
        private String paymentMethod = "BALANCE_CREDIT";

        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemDto {
        private Long id;
        private Long denominationId;
        private String denominationName;
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

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesOrderResponse {
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

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvoiceDto {
        private String companyName;
        private String companyAddress;
        private String companyPhone;
        private String companyEmail;
        private SalesOrderResponse order;
    }
}
