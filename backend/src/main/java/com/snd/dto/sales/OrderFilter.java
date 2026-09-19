package com.snd.dto.sales;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderFilter {

    private Long distributorId;
    private List<Long> distributorIds;
    private String status;
    private String paymentMethod;
    private List<String> paymentMethods;
    private Long denominationId;
    private List<Long> denominationIds;
    private String search;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime startDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime endDate;

    @Builder.Default
    private int page = 0;

    @Builder.Default
    private int size = 15;

    public List<Long> getMergedDistributorIds() {
        List<Long> merged = new ArrayList<>();
        if (distributorIds != null) {
            merged.addAll(distributorIds);
        }
        if (distributorId != null && !merged.contains(distributorId)) {
            merged.add(distributorId);
        }
        return merged;
    }

    public List<String> getMergedPaymentMethods() {
        List<String> merged = new ArrayList<>();
        if (paymentMethods != null) {
            merged.addAll(paymentMethods);
        }
        if (paymentMethod != null && !paymentMethod.isBlank() && !merged.contains(paymentMethod)) {
            merged.add(paymentMethod);
        }
        return merged;
    }

    public List<Long> getMergedDenominationIds() {
        List<Long> merged = new ArrayList<>();
        if (denominationIds != null) {
            merged.addAll(denominationIds);
        }
        if (denominationId != null && !merged.contains(denominationId)) {
            merged.add(denominationId);
        }
        return merged;
    }

    public Pageable toPageable() {
        int p = Math.max(0, page);
        int s = size > 0 ? size : 15;
        return PageRequest.of(p, s);
    }
}
