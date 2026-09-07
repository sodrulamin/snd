package com.snd.controller;

import com.snd.dto.ApiResponse;
import com.snd.dto.InventoryDto;
import com.snd.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
    public ResponseEntity<ApiResponse<List<InventoryDto.BatchSummaryDto>>> getBatches() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAllBatches()));
    }

    @GetMapping("/batches/{id}")
    public ResponseEntity<ApiResponse<InventoryDto.BatchSummaryDto>> getBatchById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getBatchById(id)));
    }

    @PostMapping("/batches/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InventoryDto.BatchSummaryDto>> generateBatch(
            @Valid @RequestBody InventoryDto.BatchGenerateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.generateBatch(request, userDetails.getUsername()), "Batch generated successfully"));
    }

    @GetMapping("/cards")
    public ResponseEntity<ApiResponse<Page<InventoryDto.CardDetailDto>>> searchCards(
            @RequestParam(required = false) Long batchId,
            @RequestParam(required = false) Long denominationId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long distributorId,
            @RequestParam(required = false) String serialNumber,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean includePlainPin) {
        Page<InventoryDto.CardDetailDto> result = inventoryService.searchCards(
                batchId, denominationId, status, distributorId, serialNumber, PageRequest.of(page, size), includePlainPin);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/cards/export/csv")
    public ResponseEntity<byte[]> exportCardsCsv(
            @RequestParam(required = false) Long batchId,
            @RequestParam(required = false) Long orderId,
            @RequestParam(defaultValue = "false") boolean includePlainPin) {
        byte[] csvData = inventoryService.exportCardsCsv(batchId, orderId, includePlainPin);
        String filename = "cards-export-" + System.currentTimeMillis() + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }

    @GetMapping("/denominations/{id}/available-range")
    public ResponseEntity<ApiResponse<InventoryDto.AvailableSerialRangeResponse>> getAvailableSerialRange(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAvailableSerialRange(id)));
    }
}
