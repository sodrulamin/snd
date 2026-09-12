package com.snd.controller;

import com.snd.dto.ApiResponse;
import com.snd.dto.CampaignExpenseDto;
import com.snd.service.CampaignExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignExpenseController {

    private final CampaignExpenseService campaignExpenseService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CampaignExpenseDto.CampaignExpenseResponse>> createCampaignExpense(
            @Valid @RequestBody CampaignExpenseDto.CreateCampaignExpenseRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        CampaignExpenseDto.CampaignExpenseResponse response = campaignExpenseService.createCampaignExpense(request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Cards disbursed and campaign expense recorded successfully"));
    }

    @PostMapping("/{id}/items")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CampaignExpenseDto.CampaignExpenseResponse>> addCardExpensesToCampaign(
            @PathVariable Long id,
            @Valid @RequestBody CampaignExpenseDto.AddExpenseItemsRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        CampaignExpenseDto.CampaignExpenseResponse response = campaignExpenseService.addCardExpensesToCampaign(
                id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Cards added to campaign and disbursed successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CampaignExpenseDto.CampaignExpenseResponse>> updateCampaignDetails(
            @PathVariable Long id,
            @Valid @RequestBody CampaignExpenseDto.UpdateCampaignRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        CampaignExpenseDto.CampaignExpenseResponse response = campaignExpenseService.updateCampaignDetails(
                id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Campaign details updated successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CampaignExpenseDto.CampaignExpenseResponse>>> getCampaignExpenses(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : null;

        Page<CampaignExpenseDto.CampaignExpenseResponse> expenses = campaignExpenseService.getCampaignExpenses(
                category, start, end, search, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(expenses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CampaignExpenseDto.CampaignExpenseResponse>> getCampaignExpenseById(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(campaignExpenseService.getCampaignExpenseById(id)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<CampaignExpenseDto.CampaignCalculationSummaryDto>> getCalculationSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : null;

        return ResponseEntity.ok(ApiResponse.success(campaignExpenseService.getCalculationSummary(start, end)));
    }
}
