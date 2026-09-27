package com.snd.controller;

import com.snd.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/company")
public class CompanyController {

    @Value("${app.company.name:Orbitalk}")
    private String companyName;

    @Value("${app.company.address:Impetus Center, 242/B Tejgaon-Gulshan Link Road, Tejgaon I/A, Dhaka-1208, Bangladesh}")
    private String companyAddress;

    @Value("${app.company.phone:+880-2-9880000}")
    private String companyPhone;

    @Value("${app.company.email:billing@orbitalk.bd}")
    private String companyEmail;

    @GetMapping("/info")
    public ResponseEntity<ApiResponse<Map<String, String>>> getCompanyInfo() {
        Map<String, String> info = Map.of(
                "companyName", companyName,
                "companyAddress", companyAddress,
                "companyPhone", companyPhone,
                "companyEmail", companyEmail
        );
        return ResponseEntity.ok(ApiResponse.success(info));
    }
}
