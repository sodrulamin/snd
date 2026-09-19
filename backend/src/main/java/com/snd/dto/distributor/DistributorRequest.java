package com.snd.dto.distributor;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DistributorRequest {
    @NotBlank(message = "Username is required")
    private String username;

    private String password;

    @NotBlank(message = "Full name / Company name is required")
    private String fullName;

    private String contactPerson;
    private String email;
    private String phone;
    @Builder.Default
    private BigDecimal creditLimit = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal discountRate = BigDecimal.ZERO;
    private String address;
    private Long partnerProfileId;
    @Builder.Default
    private String status = "ACTIVE";
}
