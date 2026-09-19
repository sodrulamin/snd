package com.snd.controller;

import com.snd.dto.ApiResponse;
import com.snd.dto.sales.CreateOrderRequest;
import com.snd.dto.sales.InvoiceDto;
import com.snd.dto.sales.OrderFilter;
import com.snd.dto.sales.SalesOrderResponse;
import com.snd.service.InvoicePdfService;
import com.snd.service.SalesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<ApiResponse<Page<SalesOrderResponse>>> getOrders(OrderFilter filter) {
        Page<SalesOrderResponse> orders = salesService.getOrders(
                filter.getMergedDistributorIds(),
                filter.getStatus(),
                filter.getMergedPaymentMethods(),
                filter.getMergedDenominationIds(),
                filter.getStartDate(),
                filter.getEndDate(),
                filter.getSearch(),
                filter.toPageable());
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/orders/all")
    public ResponseEntity<ApiResponse<List<SalesOrderResponse>>> getAllOrders(OrderFilter filter) {
        List<SalesOrderResponse> orders = salesService.getAllOrders(
                filter.getMergedDistributorIds(),
                filter.getStatus(),
                filter.getMergedPaymentMethods(),
                filter.getMergedDenominationIds(),
                filter.getStartDate(),
                filter.getEndDate(),
                filter.getSearch());
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