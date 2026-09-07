package com.snd.service;

import com.snd.dto.SalesDto;
import com.snd.model.*;
import com.snd.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class SalesService {

    private final SalesOrderRepository orderRepository;
    private final SalesOrderItemRepository orderItemRepository;
    private final RechargeCardRepository rechargeCardRepository;
    private final UserRepository userRepository;
    private final CardDenominationRepository denominationRepository;
    private final CardBatchRepository batchRepository;
    private final DistributorTransactionRepository transactionRepository;

    @Transactional
    public SalesDto.SalesOrderResponse createOrder(SalesDto.CreateOrderRequest request, String createdByUsername) {
        User distributor = userRepository.findById(request.getDistributorId())
                .orElseThrow(() -> new RuntimeException("Distributor not found: " + request.getDistributorId()));

        if (!"DISTRIBUTOR".equalsIgnoreCase(distributor.getRole())) {
            throw new IllegalArgumentException("Selected user is not a distributor");
        }

        if (!"ACTIVE".equalsIgnoreCase(distributor.getStatus())) {
            throw new IllegalStateException("Cannot create order for distributor '" + distributor.getFullName() + "' because the account is currently " + distributor.getStatus() + ".");
        }

        BigDecimal discountPercentage = request.getCustomDiscountPercentage() != null
                ? request.getCustomDiscountPercentage()
                : distributor.getDiscountRate();

        String orderNumber = "ORD-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS")) + "-" + (int)(100 + Math.random() * 900);

        int totalCardsCount = 0;
        BigDecimal totalFaceValue = BigDecimal.ZERO;
        List<SalesOrderItem> orderItems = new ArrayList<>();
        List<RechargeCard> cardsToAllocate = new ArrayList<>();
        List<String> rangeSummaries = new ArrayList<>();

        SalesOrder order = SalesOrder.builder()
                .orderNumber(orderNumber)
                .distributor(distributor)
                .totalCardsCount(0)
                .totalFaceValue(BigDecimal.ZERO)
                .discountPercentage(discountPercentage)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus("PAID")
                .orderStatus("COMPLETED")
                .notes(request.getNotes())
                .createdBy(createdByUsername)
                .build();

        order = orderRepository.save(order);

        for (SalesDto.OrderItemRequest itemReq : request.getItems()) {
            CardDenomination denomination = denominationRepository.findById(itemReq.getDenominationId())
                    .orElseThrow(() -> new RuntimeException("Card product not found: " + itemReq.getDenominationId()));

            String startSerial = itemReq.getStartSerialNumber() != null ? itemReq.getStartSerialNumber().trim() : null;
            String endSerial = itemReq.getEndSerialNumber() != null ? itemReq.getEndSerialNumber().trim() : null;

            if (!StringUtils.hasText(startSerial) || !StringUtils.hasText(endSerial)) {
                throw new IllegalArgumentException("Start and End serial numbers are required for each card product in the order");
            }

            Pattern pattern = Pattern.compile("^(.*?)(\\d+)$");
            Matcher mStart = pattern.matcher(startSerial);
            Matcher mEnd = pattern.matcher(endSerial);

            if (!mStart.matches() || !mEnd.matches()) {
                throw new IllegalArgumentException("Start and End serial numbers must end with numeric digits (e.g. 100001 or SN-100-0001)");
            }

            String prefixStart = mStart.group(1);
            String numStartStr = mStart.group(2);
            String prefixEnd = mEnd.group(1);
            String numEndStr = mEnd.group(2);

            if (!prefixStart.equals(prefixEnd)) {
                throw new IllegalArgumentException("Start and End serial numbers must have the same prefix (found '" + prefixStart + "' and '" + prefixEnd + "')");
            }

            long numStart = Long.parseLong(numStartStr);
            long numEnd = Long.parseLong(numEndStr);

            if (numEnd < numStart) {
                throw new IllegalArgumentException("End serial number (" + endSerial + ") cannot be less than start serial number (" + startSerial + ")");
            }

            int itemQty = (int) (numEnd - numStart + 1);

            // Find matching available batch encompassing [numStart, numEnd]
            List<CardBatch> availableBatches = batchRepository.findByDenominationIdAndStatus(denomination.getId(), "AVAILABLE");
            CardBatch matchingBatch = null;
            long bStartNum = 0, bEndNum = 0;
            int bPadLen = Math.max(numStartStr.length(), numEndStr.length());
            String bPrefix = prefixStart;

            for (CardBatch b : availableBatches) {
                if (StringUtils.hasText(b.getStartSerialNumber()) && StringUtils.hasText(b.getEndSerialNumber())) {
                    Matcher mbStart = pattern.matcher(b.getStartSerialNumber().trim());
                    Matcher mbEnd = pattern.matcher(b.getEndSerialNumber().trim());
                    if (mbStart.matches() && mbEnd.matches() && mbStart.group(1).equals(mbEnd.group(1)) && mbStart.group(1).equals(prefixStart)) {
                        long bs = Long.parseLong(mbStart.group(2));
                        long be = Long.parseLong(mbEnd.group(2));
                        if (numStart >= bs && numEnd <= be) {
                            matchingBatch = b;
                            bStartNum = bs;
                            bEndNum = be;
                            bPadLen = Math.max(mbStart.group(2).length(), mbEnd.group(2).length());
                            bPrefix = mbStart.group(1);
                            break;
                        }
                    }
                }
            }

            if (matchingBatch == null) {
                throw new IllegalArgumentException("No available inventory lot found containing serial range '" + startSerial + "' ~ '" + endSerial + "' for product " + denomination.getName());
            }

            BigDecimal unitWholesalePrice = denomination.getWholesalePrice() != null
                    ? denomination.getWholesalePrice()
                    : (denomination.getRetailPrice() != null ? denomination.getRetailPrice() : denomination.getFaceValue());
            BigDecimal itemDiscount = itemReq.getItemDiscountPercent() != null ? itemReq.getItemDiscountPercent() : discountPercentage;
            BigDecimal subtotalFace = unitWholesalePrice.multiply(BigDecimal.valueOf(itemQty));
            BigDecimal itemDiscountAmount = subtotalFace.multiply(itemDiscount).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal subtotalFinal = subtotalFace.subtract(itemDiscountAmount);

            totalCardsCount += itemQty;
            totalFaceValue = totalFaceValue.add(subtotalFace);

            // 1. Keep selected serial range into matchingBatch and mark as SOLD
            matchingBatch.setStartSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", numStart));
            matchingBatch.setEndSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", numEnd));
            matchingBatch.setQuantity(itemQty);
            matchingBatch.setTotalFaceValue(unitWholesalePrice.multiply(BigDecimal.valueOf(itemQty)));
            matchingBatch.setStatus("SOLD");
            CardBatch soldBatch = batchRepository.save(matchingBatch);

            // 2. Breakdown and recreate CardBatch for remaining available ranges keeping the same batchNumber
            // Case A: Sold start to middle -> remaining range [numEnd + 1, bEndNum]
            if (numStart == bStartNum && numEnd < bEndNum) {
                int remQty = (int) (bEndNum - (numEnd + 1) + 1);
                CardBatch afterBatch = CardBatch.builder()
                        .batchNumber(matchingBatch.getBatchNumber())
                        .denomination(denomination)
                        .startSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", numEnd + 1))
                        .endSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", bEndNum))
                        .quantity(remQty)
                        .totalFaceValue(unitWholesalePrice.multiply(BigDecimal.valueOf(remQty)))
                        .status("AVAILABLE")
                        .createdBy(createdByUsername)
                        .notes(matchingBatch.getNotes())
                        .build();
                batchRepository.save(afterBatch);
            }
            // Case B: Sold middle to end -> remaining range [bStartNum, numStart - 1]
            else if (numStart > bStartNum && numEnd == bEndNum) {
                int remQty = (int) ((numStart - 1) - bStartNum + 1);
                CardBatch beforeBatch = CardBatch.builder()
                        .batchNumber(matchingBatch.getBatchNumber())
                        .denomination(denomination)
                        .startSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", bStartNum))
                        .endSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", numStart - 1))
                        .quantity(remQty)
                        .totalFaceValue(unitWholesalePrice.multiply(BigDecimal.valueOf(remQty)))
                        .status("AVAILABLE")
                        .createdBy(createdByUsername)
                        .notes(matchingBatch.getNotes())
                        .build();
                batchRepository.save(beforeBatch);
            }
            // Case C: Sold middle to middle -> remaining range 1 [bStartNum, numStart - 1] AND range 2 [numEnd + 1, bEndNum]
            else if (numStart > bStartNum && numEnd < bEndNum) {
                int remQty1 = (int) ((numStart - 1) - bStartNum + 1);
                CardBatch beforeBatch = CardBatch.builder()
                        .batchNumber(matchingBatch.getBatchNumber())
                        .denomination(denomination)
                        .startSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", bStartNum))
                        .endSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", numStart - 1))
                        .quantity(remQty1)
                        .totalFaceValue(unitWholesalePrice.multiply(BigDecimal.valueOf(remQty1)))
                        .status("AVAILABLE")
                        .createdBy(createdByUsername)
                        .notes(matchingBatch.getNotes())
                        .build();
                batchRepository.save(beforeBatch);

                int remQty2 = (int) (bEndNum - (numEnd + 1) + 1);
                CardBatch afterBatch = CardBatch.builder()
                        .batchNumber(matchingBatch.getBatchNumber())
                        .denomination(denomination)
                        .startSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", numEnd + 1))
                        .endSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", bEndNum))
                        .quantity(remQty2)
                        .totalFaceValue(unitWholesalePrice.multiply(BigDecimal.valueOf(remQty2)))
                        .status("AVAILABLE")
                        .createdBy(createdByUsername)
                        .notes(matchingBatch.getNotes())
                        .build();
                batchRepository.save(afterBatch);
            }

            // Update individual RechargeCard records if present
            LocalDateTime now = LocalDateTime.now();
            for (long n = numStart; n <= numEnd; n++) {
                String sNum = bPrefix + String.format("%0" + bPadLen + "d", n);
                RechargeCard card = rechargeCardRepository.findBySerialNumber(sNum).orElse(null);
                if (card == null) {
                    card = RechargeCard.builder()
                            .serialNumber(sNum)
                            .denomination(denomination)
                            .batch(soldBatch)
                            .status("SOLD")
                            .distributor(distributor)
                            .order(order)
                            .soldAt(now)
                            .expiryDate(denomination.getAvailableUntil() != null ? denomination.getAvailableUntil() : LocalDate.now().plusYears(1))
                            .build();
                } else {
                    card.setBatch(soldBatch);
                    card.setStatus("SOLD");
                    card.setDistributor(distributor);
                    card.setOrder(order);
                    card.setSoldAt(now);
                }
                cardsToAllocate.add(card);
            }

            // Create SalesOrderItem pointing directly to sold CardBatch
            SalesOrderItem orderItem = SalesOrderItem.builder()
                    .order(order)
                    .denomination(denomination)
                    .batch(soldBatch)
                    .quantity(itemQty)
                    .unitFaceValue(unitWholesalePrice)
                    .subtotalFaceValue(subtotalFace)
                    .itemDiscountPercent(itemDiscount)
                    .subtotalFinal(subtotalFinal)
                    .build();

            orderItems.add(orderItem);
            rangeSummaries.add(denomination.getName() + " (" + itemQty + " cards): " + soldBatch.getStartSerialNumber() + " ~ " + soldBatch.getEndSerialNumber());
        }

        rechargeCardRepository.saveAll(cardsToAllocate);
        orderItemRepository.saveAll(orderItems);

        BigDecimal totalDiscountAmount = totalFaceValue.multiply(discountPercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal finalAmount = totalFaceValue.subtract(totalDiscountAmount);

        order.setTotalCardsCount(totalCardsCount);
        order.setTotalFaceValue(totalFaceValue);
        order.setDiscountAmount(totalDiscountAmount);
        order.setFinalAmount(finalAmount);
        order.setSerialRangesSummary(String.join(" | ", rangeSummaries));
        if (order.getItems() == null) {
            order.setItems(new ArrayList<>());
        } else {
            order.getItems().clear();
        }
        order.getItems().addAll(orderItems);
        order = orderRepository.save(order);

        if ("BALANCE_CREDIT".equalsIgnoreCase(request.getPaymentMethod())) {
            BigDecimal prevBalance = distributor.getBalance();
            BigDecimal newBalance = prevBalance.subtract(finalAmount);
            distributor.setBalance(newBalance);
            userRepository.save(distributor);

            DistributorTransaction txn = DistributorTransaction.builder()
                    .distributor(distributor)
                    .transactionType("ORDER_PAYMENT")
                    .amount(finalAmount)
                    .previousBalance(prevBalance)
                    .newBalance(newBalance)
                    .referenceType("ORDER")
                    .referenceId(order.getOrderNumber())
                    .notes("Payment for Order " + order.getOrderNumber() + " [Range: " + order.getSerialRangesSummary() + "]")
                    .build();
            transactionRepository.save(txn);
        }

        return mapToOrderResponse(order);
    }

    public Page<SalesDto.SalesOrderResponse> getOrders(Long distributorId, String status, String paymentMethod, LocalDateTime start, LocalDateTime end, String search, Pageable pageable) {
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;
        String statusParam = (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) ? status.trim() : null;
        String paymentParam = (paymentMethod != null && !paymentMethod.isBlank() && !"ALL".equalsIgnoreCase(paymentMethod)) ? paymentMethod.trim() : null;
        return orderRepository.filterOrders(distributorId, statusParam, paymentParam, start, end, searchParam, pageable).map(this::mapToOrderResponse);
    }

    public SalesDto.SalesOrderResponse getOrderById(Long id) {
        SalesOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));
        return mapToOrderResponse(order);
    }

    public SalesDto.SalesOrderResponse getOrderByOrderNumber(String orderNumber) {
        SalesOrder order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderNumber));
        return mapToOrderResponse(order);
    }

    public SalesDto.InvoiceDto getInvoice(Long orderId) {
        SalesOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        return SalesDto.InvoiceDto.builder()
                .companyName("IPTSP Global Connect Ltd.")
                .companyAddress("Gulshan-2, Dhaka, Bangladesh")
                .companyPhone("+880-2-9880000")
                .companyEmail("billing@iptspglobal.bd")
                .order(mapToOrderResponse(order))
                .build();
    }

    private SalesDto.SalesOrderResponse mapToOrderResponse(SalesOrder o) {
        List<SalesOrderItem> items = orderItemRepository.findByOrderId(o.getId());
        List<SalesDto.OrderItemDto> itemDtos = items.stream().map(i -> SalesDto.OrderItemDto.builder()
                .id(i.getId())
                .denominationId(i.getDenomination().getId())
                .denominationName(i.getDenomination().getName())
                .unitFaceValue(i.getUnitFaceValue())
                .batchId(i.getBatch() != null ? i.getBatch().getId() : null)
                .batchNumber(i.getBatch() != null ? i.getBatch().getBatchNumber() : null)
                .startSerialNumber(i.getBatch() != null ? i.getBatch().getStartSerialNumber() : null)
                .endSerialNumber(i.getBatch() != null ? i.getBatch().getEndSerialNumber() : null)
                .quantity(i.getQuantity())
                .subtotalFaceValue(i.getSubtotalFaceValue())
                .itemDiscountPercent(i.getItemDiscountPercent())
                .subtotalFinal(i.getSubtotalFinal())
                .build()).collect(Collectors.toList());

        return SalesDto.SalesOrderResponse.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .distributorId(o.getDistributor().getId())
                .distributorName(o.getDistributor().getFullName())
                .distributorEmail(o.getDistributor().getEmail())
                .distributorPhone(o.getDistributor().getPhone())
                .totalCardsCount(o.getTotalCardsCount())
                .totalFaceValue(o.getTotalFaceValue())
                .discountPercentage(o.getDiscountPercentage())
                .discountAmount(o.getDiscountAmount())
                .finalAmount(o.getFinalAmount())
                .paymentMethod(o.getPaymentMethod())
                .paymentStatus(o.getPaymentStatus())
                .orderStatus(o.getOrderStatus())
                .notes(o.getNotes())
                .serialRangesSummary(o.getSerialRangesSummary())
                .createdBy(o.getCreatedBy())
                .createdAt(o.getCreatedAt())
                .items(itemDtos)
                .build();
    }

    private boolean isSerialInBatch(String serial, CardBatch batch) {
        if (!StringUtils.hasText(batch.getStartSerialNumber()) || !StringUtils.hasText(batch.getEndSerialNumber())) {
            return false;
        }
        Pattern pattern = Pattern.compile("^(.*?)(\\d+)$");
        Matcher mTarget = pattern.matcher(serial.trim());
        Matcher mStart = pattern.matcher(batch.getStartSerialNumber().trim());
        Matcher mEnd = pattern.matcher(batch.getEndSerialNumber().trim());
        if (mTarget.matches() && mStart.matches() && mEnd.matches()) {
            String p1 = mTarget.group(1);
            String p2 = mStart.group(1);
            String p3 = mEnd.group(1);
            if (p1.equals(p2) && p2.equals(p3)) {
                long tNum = Long.parseLong(mTarget.group(2));
                long sNum = Long.parseLong(mStart.group(2));
                long eNum = Long.parseLong(mEnd.group(2));
                return tNum >= sNum && tNum <= eNum;
            }
        }
        return false;
    }
}
