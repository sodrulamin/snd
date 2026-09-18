package com.snd.controller;

import com.snd.dto.ApiResponse;
import com.snd.dto.sales.CreateOrderRequest;
import com.snd.dto.sales.InvoiceDto;
import com.snd.dto.sales.SalesOrderResponse;
import com.snd.service.InvoicePdfService;
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
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SalesController {

    private final SalesService salesService;
    private final InvoicePdfService invoicePdfService;

    @PostMapping("/orders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        SalesOrderResponse order = salesService.createOrder(request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(order, "Order created and cards allocated successfully"));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<SalesOrderResponse>>> getOrders(
            @RequestParam(required = false) Long distributorId,
            @RequestParam(required = false) List<Long> distributorIds,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) List<String> paymentMethods,
            @RequestParam(required = false) Long denominationId,
            @RequestParam(required = false) List<Long> denominationIds,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        List<Long> mergedDistIds = new ArrayList<>();
        if (distributorIds != null) {
            mergedDistIds.addAll(distributorIds);
        }
        if (distributorId != null && !mergedDistIds.contains(distributorId)) {
            mergedDistIds.add(distributorId);
        }

        List<String> mergedPayMethods = new ArrayList<>();
        if (paymentMethods != null) {
            mergedPayMethods.addAll(paymentMethods);
        }
        if (paymentMethod != null && !paymentMethod.isBlank() && !mergedPayMethods.contains(paymentMethod)) {
            mergedPayMethods.add(paymentMethod);
        }

        List<Long> mergedDenomIds = new ArrayList<>();
        if (denominationIds != null) {
            mergedDenomIds.addAll(denominationIds);
        }
        if (denominationId != null && !mergedDenomIds.contains(denominationId)) {
            mergedDenomIds.add(denominationId);
        }

        Page<SalesOrderResponse> orders = salesService.getOrders(
                mergedDistIds, status, mergedPayMethods, mergedDenomIds, startDate, endDate, search, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/orders/all")
    public ResponseEntity<ApiResponse<List<SalesOrderResponse>>> getAllOrders(
            @RequestParam(required = false) Long distributorId,
            @RequestParam(required = false) List<Long> distributorIds,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) List<String> paymentMethods,
            @RequestParam(required = false) Long denominationId,
            @RequestParam(required = false) List<Long> denominationIds,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<Long> mergedDistIds = new ArrayList<>();
        if (distributorIds != null) {
            mergedDistIds.addAll(distributorIds);
        }
        if (distributorId != null && !mergedDistIds.contains(distributorId)) {
            mergedDistIds.add(distributorId);
        }

        List<String> mergedPayMethods = new ArrayList<>();
        if (paymentMethods != null) {
            mergedPayMethods.addAll(paymentMethods);
        }
        if (paymentMethod != null && !paymentMethod.isBlank() && !mergedPayMethods.contains(paymentMethod)) {
            mergedPayMethods.add(paymentMethod);
        }

        List<Long> mergedDenomIds = new ArrayList<>();
        if (denominationIds != null) {
            mergedDenomIds.addAll(denominationIds);
        }
        if (denominationId != null && !mergedDenomIds.contains(denominationId)) {
            mergedDenomIds.add(denominationId);
        }

        List<SalesOrderResponse> orders = salesService.getAllOrders(
                mergedDistIds, status, mergedPayMethods, mergedDenomIds, startDate, endDate, search);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(salesService.getOrderById(id)));
    }

    @GetMapping("/orders/{id}/invoice")
    public ResponseEntity<ApiResponse<InvoiceDto>> getInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(salesService.getInvoice(id)));
    }

    @GetMapping(value = "/orders/{id}/invoice/pdf", produces = "application/pdf")
    public ResponseEntity<byte[]> getInvoicePdf(@PathVariable Long id) {
        InvoiceDto invoice = salesService.getInvoice(id);
        byte[] pdfBytes = invoicePdfService.generateInvoicePdf(invoice);
        String filename = "Invoice-" + invoice.getOrder().getOrderNumber() + ".pdf";

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/pdf")
                .body(pdfBytes);
    }

    @DeleteMapping("/orders/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteOrder(@PathVariable Long id) {
        salesService.deleteOrder(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Order deleted successfully and items returned to available inventory"));
    }
}