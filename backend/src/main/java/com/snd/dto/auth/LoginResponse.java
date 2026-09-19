package com.snd.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long id;
    private String username;
    private String name;
    private String fullName;
    private String email;
    private String mobile;
    private Long partnerProfileId;
    private String role;
    private BigDecimal balance;
    private BigDecimal creditLimit;
}
