package com.snd.controller;

import com.snd.dto.ApiResponse;
import com.snd.dto.InventoryDto;
import com.snd.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/denominations")
    public ResponseEntity<ApiResponse<List<InventoryDto.DenominationResponse>>> getDenominations() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAllDenominations()));
    }

    @GetMapping("/denominations/active")
    public ResponseEntity<ApiResponse<List<InventoryDto.DenominationResponse>>> getActiveDenominations() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getActiveDenominations()));
    }

    @PostMapping("/denominations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InventoryDto.DenominationResponse>> createDenomination(
            @Valid @RequestBody InventoryDto.DenominationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.createDenomination(request), "Card product created successfully"));
    }

    @PutMapping("/denominations/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InventoryDto.DenominationResponse>> updateDenomination(
            @PathVariable Long id,
            @Valid @RequestBody InventoryDto.DenominationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.updateDenomination(id, request), "Card product updated successfully"));
    }

    @DeleteMapping("/denominations/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteDenomination(@PathVariable Long id) {
        inventoryService.deleteDenomination(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Card product deleted successfully"));
    }

    @GetMapping("/batches")
    public ResponseEntity<ApiResponse<Page<InventoryDto.BatchSummaryDto>>> getBatches(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "AVAILABLE") String status,
            @RequestParam(required = false) Long denominationId,
            @RequestParam(required = false) List<Long> denominationIds,
            @RequestParam(required = false) List<String> batchNumbers,
            @RequestParam(required = false) String search) {
        List<Long> mergedDenomIds = new java.util.ArrayList<>();
        if (denominationIds != null) {
            mergedDenomIds.addAll(denominationIds);
        }
        if (denominationId != null && !mergedDenomIds.contains(denominationId)) {
            mergedDenomIds.add(denominationId);
        }
        return ResponseEntity.ok(ApiResponse.success(
            inventoryService.getBatches(PageRequest.of(page, size), status, mergedDenomIds, batchNumbers, search)
        ));
    }

    @GetMapping("/batches/all")
    public ResponseEntity<ApiResponse<List<InventoryDto.BatchSummaryDto>>> getAllBatches(
            @RequestParam(required = false, defaultValue = "AVAILABLE") String status,
            @RequestParam(required = false) Long denominationId,
            @RequestParam(required = false) List<Long> denominationIds,
            @RequestParam(required = false) List<String> batchNumbers,
            @RequestParam(required = false) String search) {
        List<Long> mergedDenomIds = new java.util.ArrayList<>();
        if (denominationIds != null) {
            mergedDenomIds.addAll(denominationIds);
        }
        if (denominationId != null && !mergedDenomIds.contains(denominationId)) {
            mergedDenomIds.add(denominationId);
        }
        return ResponseEntity.ok(ApiResponse.success(
            inventoryService.getBatchesFilteredList(status, mergedDenomIds, batchNumbers, search)
        ));
    }

    @GetMapping("/batches/numbers")
    public ResponseEntity<ApiResponse<List<String>>> getBatchNumbers(
            @RequestParam(required = false, defaultValue = "AVAILABLE") String status,
            @RequestParam(required = false) Long denominationId,
            @RequestParam(required = false) List<Long> denominationIds) {
        List<Long> mergedDenomIds = new java.util.ArrayList<>();
        if (denominationIds != null) {
            mergedDenomIds.addAll(denominationIds);
        }
        if (denominationId != null && !mergedDenomIds.contains(denominationId)) {
            mergedDenomIds.add(denominationId);
        }
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getDistinctBatchNumbers(status, mergedDenomIds)));
    }

    @GetMapping("/batches/denominations")
    public ResponseEntity<ApiResponse<List<InventoryDto.DenominationResponse>>> getBatchDenominations(
            @RequestParam(required = false, defaultValue = "AVAILABLE") String status) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getDistinctDenominations(status)));
    }

    @GetMapping("/batches/summary")
    public ResponseEntity<ApiResponse<InventoryDto.InventorySummaryDto>> getInventorySummary() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getInventorySummary()));
    }

    @GetMapping("/batches/{id}")
    public ResponseEntity<ApiResponse<InventoryDto.BatchSummaryDto>> getBatchById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getBatchById(id)));
    }

    @GetMapping("/batches/{id}/cards")
    public ResponseEntity<ApiResponse<List<InventoryDto.CardDetailDto>>> getBatchCards(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getBatchCards(id)));
    }

    @GetMapping("/batches/{id}/ranges")
    public ResponseEntity<ApiResponse<List<InventoryDto.BatchSerialRangeDto>>> getBatchSerialRanges(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getBatchSerialRanges(id)));
    }

    @GetMapping("/batches/lot/{batchNumber}/ranges")
    public ResponseEntity<ApiResponse<List<InventoryDto.BatchSerialRangeDto>>> getLotSerialRanges(@PathVariable String batchNumber) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getLotSerialRanges(batchNumber)));
    }

    @GetMapping("/batches/lot/{batchNumber}/cards")
    public ResponseEntity<ApiResponse<List<InventoryDto.CardDetailDto>>> getLotCards(@PathVariable String batchNumber) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getLotCards(batchNumber)));
    }

    @PostMapping("/batches/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InventoryDto.BatchSummaryDto>> generateBatch(
            @Valid @RequestBody InventoryDto.BatchGenerateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.generateBatch(request, userDetails.getUsername()), "Batch generated successfully"));
    }

    @GetMapping("/denominations/{id}/available-range")
    public ResponseEntity<ApiResponse<InventoryDto.AvailableSerialRangeResponse>> getAvailableSerialRange(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAvailableSerialRange(id)));
    }

    @DeleteMapping("/batches/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBatch(@PathVariable Long id) {
        inventoryService.deleteBatch(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Inventory lot and associated cards deleted successfully"));
    }
}
