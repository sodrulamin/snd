package com.snd.controller;

import com.snd.dto.ApiResponse;
import com.snd.dto.distributor.*;
import com.snd.service.DistributorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/distributors")
@RequiredArgsConstructor
public class DistributorController {

    private final DistributorService distributorService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DistributorResponse>>> getAllDistributors() {
        return ResponseEntity.ok(ApiResponse.success(distributorService.getAllDistributors()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DistributorResponse>> getDistributorById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(distributorService.getDistributorById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DistributorResponse>> createDistributor(
            @Valid @RequestBody DistributorRequest request) {
        return ResponseEntity.ok(ApiResponse.success(distributorService.createDistributor(request), "Distributor registered successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DistributorResponse>> updateDistributor(
            @PathVariable Long id,
            @Valid @RequestBody DistributorRequest request) {
        return ResponseEntity.ok(ApiResponse.success(distributorService.updateDistributor(id, request), "Distributor updated successfully"));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DistributorResponse>> toggleDistributorStatus(@PathVariable Long id) {
        DistributorResponse response = distributorService.toggleDistributorStatus(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Distributor status changed to " + response.getStatus()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DistributorResponse>> updateDistributorStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        DistributorResponse response = distributorService.updateDistributorStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(response, "Distributor status updated to " + response.getStatus()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteDistributor(@PathVariable Long id) {
        distributorService.deleteDistributor(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Distributor deleted successfully"));
    }

    @PostMapping("/wallet-adjustment")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TransactionDto>> processWalletAdjustment(
            @Valid @RequestBody WalletTopUpRequest request) {
        return ResponseEntity.ok(ApiResponse.success(distributorService.processWalletAdjustment(request), "Wallet adjustment processed"));
    }

    @GetMapping("/{id}/transactions")
    public ResponseEntity<ApiResponse<Page<TransactionDto>>> getDistributorTransactions(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(distributorService.getDistributorTransactions(id, PageRequest.of(page, size))));
    }

    @GetMapping("/transactions/all")
    public ResponseEntity<ApiResponse<Page<TransactionDto>>> getAllTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(distributorService.getAllTransactions(PageRequest.of(page, size))));
    }
}