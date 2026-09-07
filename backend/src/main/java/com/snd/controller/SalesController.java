package com.snd.controller;

import com.snd.dto.ApiResponse;
import com.snd.dto.SalesDto;
import com.snd.service.SalesService;
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

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SalesController {

    private final SalesService salesService;

    @PostMapping("/orders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SalesDto.SalesOrderResponse>> createOrder(
            @Valid @RequestBody SalesDto.CreateOrderRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        SalesDto.SalesOrderResponse order = salesService.createOrder(request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(order, "Order created and cards allocated successfully"));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<SalesDto.SalesOrderResponse>>> getOrders(
            @RequestParam(required = false) Long distributorId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Page<SalesDto.SalesOrderResponse> orders = salesService.getOrders(distributorId, status, paymentMethod, startDate, endDate, search, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<SalesDto.SalesOrderResponse>> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(salesService.getOrderById(id)));
    }

    @GetMapping("/orders/{id}/invoice")
    public ResponseEntity<ApiResponse<SalesDto.InvoiceDto>> getInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(salesService.getInvoice(id)));
    }
}