package com.snd.dto.voip;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoipRedeemResponse {
    private boolean success;
    private String message;
    private String serialNumber;
    private BigDecimal faceValue;
    private String currency;
    private String subscriberNumber;
    private LocalDateTime redeemedAt;
    private String transactionReference;
}
