package com.snd.dto.auth;

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
public class UserProfileDto {
    private Long id;
    private String username;
    private String name;
    private String fullName;
    private String email;
    private String mobile;
    private String phone;
    private Long partnerProfileId;
    private String role;
    private String status;
    private BigDecimal balance;
    private BigDecimal creditLimit;
    private BigDecimal discountRate;
    private String address;
    private LocalDateTime createdAt;
}
