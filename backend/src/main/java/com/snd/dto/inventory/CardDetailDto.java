package com.snd.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardDetailDto {
    private Long id;
    private Long batchId;
    private String batchNumber;
    private Long denominationId;
    private String denominationCode;
    private String denominationName;
    private BigDecimal faceValue;
    private BigDecimal retailPrice;
    private BigDecimal wholesalePrice;
    private String currency;
    private String serialNumber;
    private String pinMasked;
    private String pinPlain;
    private String status;
    private Long distributorId;
    private String distributorName;
    private Long orderId;
    private String orderNumber;
    private LocalDateTime soldAt;
    private LocalDateTime redeemedAt;
    private LocalDate expiryDate;
    private LocalDateTime createdAt;
}
