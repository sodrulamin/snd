package com.snd.dto.sales;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemRequest {
    @NotNull(message = "Card product (Denomination ID) is required")
    private Long denominationId;

    private Long batchId;

    private String startSerialNumber;
    private String endSerialNumber;

    private Integer quantity;

    private BigDecimal itemDiscountPercent;
}
