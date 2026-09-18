package com.snd.dto.inventory;

import com.snd.enums.BatchStatus;
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
public class BatchSummaryDto {
    private Long id;
    private String batchNumber;
    private Long denominationId;
    private String denominationCode;
    private String denominationName;
    private BigDecimal faceValue;
    private BigDecimal retailPrice;
    private BigDecimal wholesalePrice;
    private String currency;
    private Integer quantity;
    private String startSerialNumber;
    private String endSerialNumber;
    private Integer inStockCount;
    private Integer soldCount;
    private BigDecimal totalFaceValue;
    private BatchStatus status;
    private LocalDateTime generatedAt;
    private LocalDate expiryDate;
    private String notes;
    private String createdBy;
}
