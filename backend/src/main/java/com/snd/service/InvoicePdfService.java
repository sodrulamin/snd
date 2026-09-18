package com.snd.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.snd.dto.sales.InvoiceDto;
import com.snd.dto.sales.OrderItemDto;
import com.snd.dto.sales.SalesOrderResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Slf4j
public class InvoicePdfService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("#,##0.00");

    // Colors matching IPTSP brand
    private static final Color COLOR_PRIMARY = new Color(13, 148, 136);       // #0d9488 Teal
    private static final Color COLOR_PRIMARY_DARK = new Color(15, 118, 110);  // #0f766e Dark Teal
    private static final Color COLOR_TEXT_DARK = new Color(30, 41, 59);        // #1e293b Slate 800
    private static final Color COLOR_TEXT_MUTED = new Color(100, 116, 139);    // #64748b Slate 500
    private static final Color COLOR_BG_LIGHT = new Color(248, 250, 252);      // #f8fafc Slate 50
    private static final Color COLOR_BORDER = new Color(226, 232, 240);        // #e2e8f0 Slate 200
    private static final Color COLOR_BADGE_BG = new Color(204, 251, 241);      // #ccfbf1 Teal 100
    private static final Color COLOR_BADGE_TEXT = new Color(15, 118, 110);    // #0f766e

    // Fonts
    private static final Font FONT_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, COLOR_PRIMARY_DARK);
    private static final Font FONT_SUBTITLE = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_TEXT_MUTED);
    private static final Font FONT_SECTION_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, COLOR_PRIMARY_DARK);
    private static final Font FONT_BOLD_MD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, COLOR_TEXT_DARK);
    private static final Font FONT_BODY = FontFactory.getFont(FontFactory.HELVETICA, 9, COLOR_TEXT_DARK);
    private static final Font FONT_BODY_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, COLOR_TEXT_DARK);
    private static final Font FONT_BODY_MUTED = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_TEXT_MUTED);
    private static final Font FONT_TABLE_HEADER = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE);
    private static final Font FONT_TABLE_CELL = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_TEXT_DARK);
    private static final Font FONT_TABLE_CELL_MONO = FontFactory.getFont(FontFactory.COURIER, 8, COLOR_TEXT_DARK);
    private static final Font FONT_TOTAL_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, COLOR_PRIMARY_DARK);
    private static final Font FONT_TOTAL_VALUE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, COLOR_PRIMARY_DARK);
    private static final Font FONT_FOOTER = FontFactory.getFont(FontFactory.HELVETICA, 7, COLOR_TEXT_MUTED);

    /**
     * Generates a PDF invoice byte array from a SalesDto.InvoiceDto object.
     */
    public byte[] generateInvoicePdf(InvoiceDto invoice) {
        if (invoice == null || invoice.getOrder() == null) {
            throw new IllegalArgumentException("Invoice and Order data cannot be null");
        }

        SalesOrderResponse order = invoice.getOrder();

        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // 1. Header Section (Company info & Invoice badge)
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{55f, 45f});

            // Company Info Cell
            PdfPCell companyCell = new PdfPCell();
            companyCell.setBorder(Rectangle.NO_BORDER);
            companyCell.addElement(new Paragraph(invoice.getCompanyName() != null ? invoice.getCompanyName() : "IPTSP Global Connect Ltd.", FONT_TITLE));
            companyCell.addElement(new Paragraph(invoice.getCompanyAddress() != null ? invoice.getCompanyAddress() : "Gulshan-2, Dhaka, Bangladesh", FONT_SUBTITLE));
            companyCell.addElement(new Paragraph("Tel: " + (invoice.getCompanyPhone() != null ? invoice.getCompanyPhone() : "+880-2-9880000") +
                    "  |  Email: " + (invoice.getCompanyEmail() != null ? invoice.getCompanyEmail() : "billing@iptspglobal.bd"), FONT_SUBTITLE));
            headerTable.addCell(companyCell);

            // Invoice Title & Number Cell (Right aligned)
            PdfPCell invoiceTitleCell = new PdfPCell();
            invoiceTitleCell.setBorder(Rectangle.NO_BORDER);
            invoiceTitleCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

            Paragraph badgePara = new Paragraph("OFFICIAL INVOICE & VOUCHER", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_BADGE_TEXT));
            badgePara.setAlignment(Element.ALIGN_RIGHT);
            invoiceTitleCell.addElement(badgePara);

            Paragraph orderNumPara = new Paragraph(order.getOrderNumber(), FONT_BOLD_MD);
            orderNumPara.setAlignment(Element.ALIGN_RIGHT);
            invoiceTitleCell.addElement(orderNumPara);

            String orderDate = order.getCreatedAt() != null ? order.getCreatedAt().format(DATE_FORMATTER) : "N/A";
            Paragraph datePara = new Paragraph("Date: " + orderDate, FONT_BODY_MUTED);
            datePara.setAlignment(Element.ALIGN_RIGHT);
            invoiceTitleCell.addElement(datePara);

            Paragraph paymentPara = new Paragraph("Payment: " + (order.getPaymentMethod() != null ? order.getPaymentMethod() : "N/A"), FONT_BODY_MUTED);
            paymentPara.setAlignment(Element.ALIGN_RIGHT);
            invoiceTitleCell.addElement(paymentPara);

            headerTable.addCell(invoiceTitleCell);
            document.add(headerTable);

            document.add(new Paragraph(" ")); // Spacer

            // 2. Info Cards (Distributor Partner & Order Details)
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setWidths(new float[]{50f, 50f});

            // Distributor Info
            PdfPCell distCard = new PdfPCell();
            distCard.setBackgroundColor(COLOR_BG_LIGHT);
            distCard.setBorderColor(COLOR_BORDER);
            distCard.setPadding(10);
            distCard.addElement(new Paragraph("DISTRIBUTOR PARTNER", FONT_SECTION_TITLE));
            distCard.addElement(new Paragraph(order.getDistributorName() != null ? order.getDistributorName() : "N/A", FONT_BODY_BOLD));
            distCard.addElement(new Paragraph("Email: " + (order.getDistributorEmail() != null ? order.getDistributorEmail() : "N/A"), FONT_BODY));
            distCard.addElement(new Paragraph("Phone: " + (order.getDistributorPhone() != null ? order.getDistributorPhone() : "N/A"), FONT_BODY));
            infoTable.addCell(distCard);

            // Order Status Info
            PdfPCell statusCard = new PdfPCell();
            statusCard.setBackgroundColor(COLOR_BG_LIGHT);
            statusCard.setBorderColor(COLOR_BORDER);
            statusCard.setPadding(10);
            statusCard.addElement(new Paragraph("ORDER & DISPATCH STATUS", FONT_SECTION_TITLE));
            statusCard.addElement(new Paragraph("Order Status: " + (order.getOrderStatus() != null ? order.getOrderStatus() : "COMPLETED"), FONT_BODY));
            statusCard.addElement(new Paragraph("Payment Status: " + (order.getPaymentStatus() != null ? order.getPaymentStatus() : "PAID"), FONT_BODY));
            statusCard.addElement(new Paragraph("Currency: BDT (Bangladeshi Taka - \u09F3)", FONT_BODY));
            infoTable.addCell(statusCard);

            document.add(infoTable);
            document.add(new Paragraph(" ")); // Spacer

            // 3. Serialized Items Table
            PdfPTable itemsTable = new PdfPTable(7);
            itemsTable.setWidthPercentage(100);
            itemsTable.setWidths(new float[]{6f, 22f, 32f, 10f, 10f, 8f, 12f});

            // Table Headers
            addHeaderCell(itemsTable, "SL");
            addHeaderCell(itemsTable, "Denomination");
            addHeaderCell(itemsTable, "Serial Range (From ~ To)");
            addHeaderCell(itemsTable, "Face Val");
            addHeaderCell(itemsTable, "Quantity");
            addHeaderCell(itemsTable, "Discount");
            addHeaderCell(itemsTable, "Net Total");

            // Items Rows
            List<OrderItemDto> items = order.getItems();
            if (items != null && !items.isEmpty()) {
                int sl = 1;
                for (OrderItemDto item : items) {
                    Color rowBg = (sl % 2 == 0) ? COLOR_BG_LIGHT : Color.WHITE;

                    addTableCell(itemsTable, String.valueOf(sl), Element.ALIGN_CENTER, rowBg, FONT_TABLE_CELL);

                    String denomTitle = item.getDenominationName() != null ? item.getDenominationName() : "Card";
                    if (item.getBatchNumber() != null && !item.getBatchNumber().isBlank()) {
                        denomTitle += "\n[Batch: " + item.getBatchNumber() + "]";
                    }
                    addTableCell(itemsTable, denomTitle, Element.ALIGN_LEFT, rowBg, FONT_TABLE_CELL);

                    String serialRange = item.getSerialRange();
                    if (serialRange == null || serialRange.isBlank()) {
                        serialRange = (item.getStartSerialNumber() != null ? item.getStartSerialNumber() : "") +
                                " ~ " + (item.getEndSerialNumber() != null ? item.getEndSerialNumber() : "");
                    }
                    addTableCell(itemsTable, serialRange, Element.ALIGN_LEFT, rowBg, FONT_TABLE_CELL_MONO);

                    BigDecimal unitPrice = item.getUnitFaceValue() != null ? item.getUnitFaceValue() : BigDecimal.ZERO;
                    addTableCell(itemsTable, formatCurrency(unitPrice), Element.ALIGN_RIGHT, rowBg, FONT_TABLE_CELL);

                    Integer qty = item.getQuantity() != null ? item.getQuantity() : 0;
                    addTableCell(itemsTable, qty + " cards", Element.ALIGN_RIGHT, rowBg, FONT_TABLE_CELL);

                    BigDecimal disc = item.getItemDiscountPercent() != null ? item.getItemDiscountPercent() : BigDecimal.ZERO;
                    addTableCell(itemsTable, disc.toPlainString() + "%", Element.ALIGN_RIGHT, rowBg, FONT_TABLE_CELL);

                    BigDecimal subtotal = item.getSubtotalFinal() != null ? item.getSubtotalFinal() : BigDecimal.ZERO;
                    addTableCell(itemsTable, formatCurrency(subtotal), Element.ALIGN_RIGHT, rowBg, FONT_TABLE_CELL);

                    sl++;
                }
            } else {
                PdfPCell emptyCell = new PdfPCell(new Paragraph("No item records available", FONT_TABLE_CELL));
                emptyCell.setColspan(7);
                emptyCell.setPadding(10);
                emptyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                itemsTable.addCell(emptyCell);
            }

            document.add(itemsTable);
            document.add(new Paragraph(" "));

            // 4. Totals Summary Box (Right aligned table)
            PdfPTable summaryContainer = new PdfPTable(2);
            summaryContainer.setWidthPercentage(100);
            summaryContainer.setWidths(new float[]{45f, 55f});

            // Left placeholder
            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorder(Rectangle.NO_BORDER);
            if (order.getNotes() != null && !order.getNotes().isBlank()) {
                leftCell.addElement(new Paragraph("Order Notes:", FONT_SECTION_TITLE));
                leftCell.addElement(new Paragraph(order.getNotes(), FONT_BODY_MUTED));
            }
            summaryContainer.addCell(leftCell);

            // Right Totals Table
            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(100);
            totalsTable.setWidths(new float[]{60f, 40f});

            addTotalRow(totalsTable, "Total Cards Distributed:", (order.getTotalCardsCount() != null ? order.getTotalCardsCount() : 0) + " units", false);
            addTotalRow(totalsTable, "Retail Face Value:", formatCurrency(order.getTotalFaceValue()), false);

            BigDecimal discPercent = order.getDiscountPercentage() != null ? order.getDiscountPercentage() : BigDecimal.ZERO;
            addTotalRow(totalsTable, "Volume Discount (" + discPercent.toPlainString() + "%):",
                    "-" + formatCurrency(order.getDiscountAmount()), false);

            addTotalRow(totalsTable, "Final Amount Paid:", formatCurrency(order.getFinalAmount()), true);

            PdfPCell totalsWrapper = new PdfPCell(totalsTable);
            totalsWrapper.setBorder(Rectangle.NO_BORDER);
            summaryContainer.addCell(totalsWrapper);

            document.add(summaryContainer);

            // 5. Verification & Legal Footer Notice
            document.add(new Paragraph(" "));
            Paragraph footerNotice1 = new Paragraph(
                    "Serialized Product Notice: All cards in the specified serial ranges have been activated and allocated to " +
                            (order.getDistributorName() != null ? order.getDistributorName() : "the distributor") + ".",
                    FONT_BODY_MUTED);
            footerNotice1.setAlignment(Element.ALIGN_CENTER);
            document.add(footerNotice1);

            Paragraph footerNotice2 = new Paragraph(
                    "Cryptographically hashed PINs are valid for subscriber talk-time recharge on the IPTSP platform. Currency: Bangladeshi Taka (BDT / \u09F3).",
                    FONT_FOOTER);
            footerNotice2.setAlignment(Element.ALIGN_CENTER);
            document.add(footerNotice2);

            document.close();
            return out.toByteArray();

        } catch (DocumentException e) {
            log.error("Failed to generate invoice PDF for order '{}': {}", order.getOrderNumber(), e.getMessage(), e);
            throw new RuntimeException("Failed to generate invoice PDF: " + e.getMessage(), e);
        }
    }

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, FONT_TABLE_HEADER));
        cell.setBackgroundColor(COLOR_PRIMARY);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(6);
        cell.setBorderColor(COLOR_PRIMARY_DARK);
        table.addCell(cell);
    }

    private void addTableCell(PdfPTable table, String text, int align, Color bg, Font font) {
        PdfPCell cell = new PdfPCell(new Paragraph(text != null ? text : "", font));
        cell.setBackgroundColor(bg);
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(5);
        cell.setBorderColor(COLOR_BORDER);
        table.addCell(cell);
    }

    private void addTotalRow(PdfPTable table, String label, String value, boolean isFinal) {
        Font labelFont = isFinal ? FONT_TOTAL_TITLE : FONT_BODY;
        Font valueFont = isFinal ? FONT_TOTAL_VALUE : FONT_BODY_BOLD;
        Color bgColor = isFinal ? COLOR_BADGE_BG : COLOR_BG_LIGHT;

        PdfPCell labelCell = new PdfPCell(new Paragraph(label, labelFont));
        labelCell.setBackgroundColor(bgColor);
        labelCell.setPadding(5);
        labelCell.setBorderColor(COLOR_BORDER);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Paragraph(value, valueFont));
        valueCell.setBackgroundColor(bgColor);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valueCell.setPadding(5);
        valueCell.setBorderColor(COLOR_BORDER);
        table.addCell(valueCell);
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "\u09F30.00";
        return "\u09F3" + CURRENCY_FORMAT.format(amount);
    }
}
