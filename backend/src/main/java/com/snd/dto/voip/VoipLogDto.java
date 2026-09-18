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
public class VoipLogDto {
    private Long id;
    private String serialNumber;
    private Long distributorId;
    private String subscriberVoipNumber;
    private BigDecimal faceValue;
    private String status;
    private String failureReason;
    private String ipAddress;
    private LocalDateTime redeemedAt;
}
