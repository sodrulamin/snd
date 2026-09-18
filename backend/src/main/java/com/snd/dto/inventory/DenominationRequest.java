package com.snd.dto.inventory;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DenominationRequest {
    @NotBlank(message = "Card unique code is required")
    private String code;

    @NotBlank(message = "Card name is required")
    private String name;

    @NotNull(message = "Retailer price is required")
    private BigDecimal retailPrice;

    @NotNull(message = "Wholesale price is required")
    private BigDecimal wholesalePrice;

    @NotNull(message = "Available from date is required")
    private LocalDate availableFrom;

    @NotNull(message = "Available until date is required")
    private LocalDate availableUntil;

    private BigDecimal faceValue;

    @Builder.Default
    private String currency = "BDT";

    private Integer validityDays;

    private String description;

    @Builder.Default
    private Boolean isActive = true;
}
