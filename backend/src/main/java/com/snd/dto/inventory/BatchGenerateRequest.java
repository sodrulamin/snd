package com.snd.dto.inventory;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchGenerateRequest {
    @NotNull(message = "Card product (Denomination ID) is required")
    private Long denominationId;

    private Integer quantity;

    private String startSerialNumber;
    private String endSerialNumber;

    private LocalDate availableUntil;
    private LocalDate expiryDate;
    private Integer validityDays;

    private String notes;
}
