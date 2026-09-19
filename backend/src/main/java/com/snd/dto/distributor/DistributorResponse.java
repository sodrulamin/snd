package com.snd.dto.distributor;

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
public class DistributorResponse {
    private Long id;
    private String username;
    private Long partnerProfileId;
    private String companyName;
    private String name;
    private String mobile;
    private String fullName;
    private String contactPerson;
    private String email;
    private String phone;
    private String status;
    private BigDecimal balance;
    private BigDecimal creditLimit;
    private BigDecimal availableCredit;
    private BigDecimal discountRate;
    private String address;
    private Long totalOrdersCount;
    private BigDecimal totalPurchasesAmount;
    private LocalDateTime createdAt;
}
