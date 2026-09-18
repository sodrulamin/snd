package com.snd.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DenominationResponse {
    private Long id;
    private String code;
    private String name;
    private BigDecimal retailPrice;
    private BigDecimal wholesalePrice;
    private BigDecimal faceValue;
    private LocalDate availableFrom;
    private LocalDate availableUntil;
    private String currency;
    private Integer validityDays;
    private String description;
    private Boolean isActive;
    private Long availableStock;
    private Long totalCardsGenerated;
    private Long totalCardsSold;
}
