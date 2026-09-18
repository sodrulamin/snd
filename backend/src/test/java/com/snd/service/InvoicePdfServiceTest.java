package com.snd.service;

import com.snd.dto.sales.InvoiceDto;
import com.snd.dto.sales.OrderItemDto;
import com.snd.dto.sales.SalesOrderResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("InvoicePdfService Tests")
class InvoicePdfServiceTest {

    private InvoicePdfService invoicePdfService;

    @BeforeEach
    void setUp() {
        invoicePdfService = new InvoicePdfService();
    }

    @Test
    @DisplayName("generateInvoicePdf should produce valid PDF byte array with %PDF header")
    void generateInvoicePdf_success() {
        OrderItemDto item1 = OrderItemDto.builder()
                .denominationName("Tk 50")
                .batchNumber("LOT-50-20260901")
                .serialRange("SN-050-0001 ~ SN-050-0200")
                .unitFaceValue(BigDecimal.valueOf(50))
                .quantity(200)
                .itemDiscountPercent(BigDecimal.valueOf(5))
                .subtotalFinal(BigDecimal.valueOf(9500))
                .build();

        OrderItemDto item2 = OrderItemDto.builder()
                .denominationName("Tk 100")
                .batchNumber("LOT-100-20260901")
                .serialRange("SN-100-0001 ~ SN-100-0300")
                .unitFaceValue(BigDecimal.valueOf(100))
                .quantity(300)
                .itemDiscountPercent(BigDecimal.valueOf(5))
                .subtotalFinal(BigDecimal.valueOf(28500))
                .build();

        SalesOrderResponse order = SalesOrderResponse.builder()
                .orderNumber("ORD-20260916-888")
                .distributorName("Metro Distribution Ltd.")
                .distributorEmail("metro@ainext.site")
                .distributorPhone("+8801711223344")
                .totalCardsCount(500)
                .totalFaceValue(BigDecimal.valueOf(40000))
                .discountPercentage(BigDecimal.valueOf(5))
                .discountAmount(BigDecimal.valueOf(2000))
                .finalAmount(BigDecimal.valueOf(38000))
                .paymentMethod("BALANCE_CREDIT")
                .paymentStatus("PAID")
                .orderStatus("COMPLETED")
                .notes("Standard monthly replenishment allocation.")
                .createdAt(LocalDateTime.now())
                .items(List.of(item1, item2))
                .build();

        InvoiceDto invoice = InvoiceDto.builder()
                .companyName("IPTSP Global Connect Ltd.")
                .companyAddress("Gulshan-2, Dhaka-1212, Bangladesh")
                .companyPhone("+880-2-9880000")
                .companyEmail("billing@iptspglobal.bd")
                .order(order)
                .build();

        byte[] pdf = invoicePdfService.generateInvoicePdf(invoice);

        assertThat(pdf).isNotNull();
        assertThat(pdf.length).isGreaterThan(1000);

        // Verify PDF magic bytes '%PDF'
        String header = new String(pdf, 0, 4, StandardCharsets.US_ASCII);
        assertThat(header).isEqualTo("%PDF");
    }

    @Test
    @DisplayName("generateInvoicePdf should throw IllegalArgumentException when invoice or order is null")
    void generateInvoicePdf_nullChecks() {
        assertThatThrownBy(() -> invoicePdfService.generateInvoicePdf(null))
                .isInstanceOf(IllegalArgumentException.class);

        InvoiceDto emptyInvoice = InvoiceDto.builder().order(null).build();
        assertThatThrownBy(() -> invoicePdfService.generateInvoicePdf(emptyInvoice))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
