package com.snd.dto.sales;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderRequest {
    @NotNull(message = "Distributor ID is required")
    private Long distributorId;

    @NotEmpty(message = "Order must contain at least one item")
    private List<OrderItemRequest> items;

    private BigDecimal customDiscountPercentage;

    @Builder.Default
    private String paymentMethod = "BALANCE_CREDIT";

    private String notes;
}
