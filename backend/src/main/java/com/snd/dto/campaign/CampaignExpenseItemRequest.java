package com.snd.dto.campaign;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignExpenseItemRequest {
    @NotNull(message = "Card product (Denomination ID) is required")
    private Long denominationId;

    @NotBlank(message = "Start serial number is required")
    private String startSerialNumber;

    @NotBlank(message = "End serial number is required")
    private String endSerialNumber;

    private String notes;
}
