package com.snd.dto.distributor;

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
public class WalletTopUpRequest {
    @NotNull(message = "Distributor ID is required")
    private Long distributorId;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    @Builder.Default
    private String transactionType = "CREDIT";

    @Builder.Default
    private String referenceType = "BANK_TRANSFER";

    private String referenceId;

    private String notes;
}
