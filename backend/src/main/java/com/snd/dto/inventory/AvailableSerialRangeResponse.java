package com.snd.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableSerialRangeResponse {
    private Long denominationId;
    private String denominationName;
    private boolean available;
    private String startSerialNumber;
    private String endSerialNumber;
    private Integer availableCount;
    private String batchNumber;
}
