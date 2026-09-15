package com.snd.service;

import com.snd.dto.SalesDto;
import com.snd.enums.BatchStatus;
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
    private final CampaignExpenseItemRepository campaignExpenseItemRepository;
    private final InvoicePdfService invoicePdfService;
    private final MailService mailService;

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
            List<CardBatch> availableBatches = batchRepository.findByDenominationIdAndStatus(denomination.getId(), BatchStatus.AVAILABLE);
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
            matchingBatch.setStatus(BatchStatus.SOLD);
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
                        .status(BatchStatus.AVAILABLE)
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
                        .status(BatchStatus.AVAILABLE)
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
                        .status(BatchStatus.AVAILABLE)
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
                        .status(BatchStatus.AVAILABLE)
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

        SalesDto.SalesOrderResponse response = mapToOrderResponse(order);

        // Generate PDF Invoice and dispatch confirmation email with creator in CC
        try {
            SalesDto.InvoiceDto invoiceDto = getInvoice(order.getId());
            byte[] invoicePdf = invoicePdfService.generateInvoicePdf(invoiceDto);

            String creatorEmail = null;
            if (createdByUsername != null && !createdByUsername.isBlank()) {
                User creator = userRepository.findByUsername(createdByUsername).orElse(null);
                if (creator != null && creator.getEmail() != null) {
                    creatorEmail = creator.getEmail().trim();
                }
            }

            mailService.sendOrderConfirmationEmail(response, distributor, creatorEmail, invoicePdf);
        } catch (Exception e) {
            log.error("Failed to generate invoice or dispatch order confirmation email for order '{}': {}",
                    order.getOrderNumber(), e.getMessage(), e);
        }

        return response;
    }

    public Page<SalesDto.SalesOrderResponse> getOrders(
            List<Long> distributorIds,
            String status,
            List<String> paymentMethods,
            List<Long> denominationIds,
            LocalDateTime start,
            LocalDateTime end,
            String search,
            Pageable pageable
    ) {
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;
        String statusParam = (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) ? status.trim() : null;
        List<Long> filterDistIds = (distributorIds != null && !distributorIds.isEmpty()) ? distributorIds : null;
        List<String> filterPayments = (paymentMethods != null && !paymentMethods.isEmpty()) ? paymentMethods : null;
        List<Long> filterDenomIds = (denominationIds != null && !denominationIds.isEmpty()) ? denominationIds : null;
        return orderRepository.filterOrders(filterDistIds, statusParam, filterPayments, filterDenomIds, start, end, searchParam, pageable).map(this::mapToOrderResponse);
    }

    public Page<SalesDto.SalesOrderResponse> getOrders(Long distributorId, String status, String paymentMethod, List<Long> denominationIds, LocalDateTime start, LocalDateTime end, String search, Pageable pageable) {
        List<Long> distIds = distributorId != null ? List.of(distributorId) : null;
        List<String> payMethods = (paymentMethod != null && !paymentMethod.isBlank()) ? List.of(paymentMethod) : null;
        return getOrders(distIds, status, payMethods, denominationIds, start, end, search, pageable);
    }

    public Page<SalesDto.SalesOrderResponse> getOrders(Long distributorId, String status, String paymentMethod, LocalDateTime start, LocalDateTime end, String search, Pageable pageable) {
        return getOrders(distributorId, status, paymentMethod, null, start, end, search, pageable);
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

    @Transactional
    public void deleteOrder(Long orderId) {
        SalesOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        // 1. Validation: Ensure none of the cards in this order have been redeemed
        List<RechargeCard> cards = rechargeCardRepository.findByOrderId(order.getId());
        boolean hasRedeemed = cards.stream().anyMatch(c -> "REDEEMED".equalsIgnoreCase(c.getStatus()));
        if (hasRedeemed) {
            throw new IllegalStateException("Cannot delete order '" + order.getOrderNumber() + "' because one or more cards have already been redeemed by customers.");
        }

        // 2. Revert distributor wallet balance if order was paid with BALANCE_CREDIT
        if (order.getFinalAmount() != null && order.getFinalAmount().compareTo(BigDecimal.ZERO) > 0) {
            User distributor = order.getDistributor();
            if (distributor != null) {
                BigDecimal prevBalance = distributor.getBalance() != null ? distributor.getBalance() : BigDecimal.ZERO;
                BigDecimal newBalance = prevBalance.add(order.getFinalAmount());
                distributor.setBalance(newBalance);
                userRepository.save(distributor);

                DistributorTransaction txn = DistributorTransaction.builder()
                        .distributor(distributor)
                        .transactionType("ORDER_REFUND")
                        .amount(order.getFinalAmount())
                        .previousBalance(prevBalance)
                        .newBalance(newBalance)
                        .referenceType("ORDER_CANCELLATION")
                        .referenceId(order.getOrderNumber())
                        .notes("Refund for deleted Order " + order.getOrderNumber() + " [Restored " + order.getTotalCardsCount() + " cards to inventory]")
                        .build();
                transactionRepository.save(txn);
            }
        }

        // 3. Mark all cards as IN_STOCK and disassociate them from order and distributor
        if (!cards.isEmpty()) {
            for (RechargeCard card : cards) {
                card.setStatus("IN_STOCK");
                card.setOrder(null);
                card.setDistributor(null);
                card.setSoldAt(null);
            }
            rechargeCardRepository.saveAll(cards);
            rechargeCardRepository.flush();
        }

        // 4. Restore sold CardBatches to AVAILABLE status and collect affected denomination IDs
        List<SalesOrderItem> items = orderItemRepository.findByOrderId(order.getId());
        List<Long> affectedDenominationIds = new ArrayList<>();
        List<CardBatch> batchesToRestore = new ArrayList<>();

        for (SalesOrderItem item : items) {
            if (item.getDenomination() != null && !affectedDenominationIds.contains(item.getDenomination().getId())) {
                affectedDenominationIds.add(item.getDenomination().getId());
            }
            if (item.getBatch() != null) {
                CardBatch b = item.getBatch();
                b.setStatus(BatchStatus.AVAILABLE);
                batchesToRestore.add(b);
            }
        }

        if (!batchesToRestore.isEmpty()) {
            batchRepository.saveAll(batchesToRestore);
            batchRepository.flush();
        }

        // 5. Delete order items and the order itself
        orderItemRepository.deleteAll(items);
        orderRepository.delete(order);
        orderRepository.flush();

        log.info("Order {} deleted successfully. Cards restored to IN_STOCK. Starting sequential inventory merge...", order.getOrderNumber());

        // 6. Merge sequential available inventory batches for each affected denomination
        for (Long denomId : affectedDenominationIds) {
            mergeSequentialBatches(denomId);
        }
    }

    /**
     * Finds and merges all AVAILABLE batches for a denomination whose serial ranges are sequential.
     * Repoints any individual cards, order items, and campaign items before deleting the merged secondary batches.
     */
    private void mergeSequentialBatches(Long denominationId) {
        CardDenomination denomination = denominationRepository.findById(denominationId).orElse(null);
        if (denomination == null) return;

        BigDecimal unitWholesale = denomination.getWholesalePrice() != null
                ? denomination.getWholesalePrice()
                : (denomination.getRetailPrice() != null ? denomination.getRetailPrice() : denomination.getFaceValue());

        Pattern pattern = Pattern.compile("^(.*?)(\\d+)$");

        boolean mergedAny;
        do {
            mergedAny = false;
            List<CardBatch> availableBatches = batchRepository.findByDenominationIdAndStatus(denominationId, BatchStatus.AVAILABLE);
            if (availableBatches.size() < 2) {
                break;
            }

            // Parse valid serial ranges
            List<BatchRange> ranges = new ArrayList<>();
            for (CardBatch b : availableBatches) {
                if (!StringUtils.hasText(b.getStartSerialNumber()) || !StringUtils.hasText(b.getEndSerialNumber())) {
                    continue;
                }
                Matcher mStart = pattern.matcher(b.getStartSerialNumber().trim());
                Matcher mEnd = pattern.matcher(b.getEndSerialNumber().trim());
                if (mStart.matches() && mEnd.matches() && mStart.group(1).equals(mEnd.group(1))) {
                    String prefix = mStart.group(1);
                    long startNum = Long.parseLong(mStart.group(2));
                    long endNum = Long.parseLong(mEnd.group(2));
                    int padLen = Math.max(mStart.group(2).length(), mEnd.group(2).length());
                    ranges.add(new BatchRange(b, prefix, startNum, endNum, padLen));
                }
            }

            // Look for any two available batches that are contiguous / sequential
            for (int i = 0; i < ranges.size(); i++) {
                BatchRange r1 = ranges.get(i);
                for (int j = i + 1; j < ranges.size(); j++) {
                    BatchRange r2 = ranges.get(j);

                    // Must share the exact same prefix
                    if (!r1.prefix.equals(r2.prefix)) {
                        continue;
                    }

                    // Check if r1 and r2 are sequential:
                    // r1 immediately precedes r2 OR r2 immediately precedes r1 OR overlapping
                    boolean contiguous = (r1.endNum + 1 == r2.startNum) || (r2.endNum + 1 == r1.startNum);
                    boolean overlapping = (r1.startNum <= r2.endNum && r2.startNum <= r1.endNum);

                    if (!contiguous && !overlapping) {
                        continue;
                    }

                    // Found sequential pair! Primary keeps earlier start number
                    BatchRange primary = (r1.startNum <= r2.startNum) ? r1 : r2;
                    BatchRange secondary = (primary == r1) ? r2 : r1;

                    long newStart = Math.min(r1.startNum, r2.startNum);
                    long newEnd = Math.max(r1.endNum, r2.endNum);
                    int padLen = Math.max(r1.padLen, r2.padLen);
                    int newQty = (int) (newEnd - newStart + 1);

                    CardBatch primaryBatch = primary.batch;
                    CardBatch secondaryBatch = secondary.batch;

                    String oldPrimaryStart = primaryBatch.getStartSerialNumber();
                    String oldPrimaryEnd = primaryBatch.getEndSerialNumber();
                    String oldSecondaryStart = secondaryBatch.getStartSerialNumber();
                    String oldSecondaryEnd = secondaryBatch.getEndSerialNumber();

                    primaryBatch.setStartSerialNumber(primary.prefix + String.format("%0" + padLen + "d", newStart));
                    primaryBatch.setEndSerialNumber(primary.prefix + String.format("%0" + padLen + "d", newEnd));
                    primaryBatch.setQuantity(newQty);
                    primaryBatch.setTotalFaceValue(unitWholesale.multiply(BigDecimal.valueOf(newQty)));

                    // 1. Repoint any cards linked to secondaryBatch to primaryBatch
                    List<RechargeCard> secondaryCards = rechargeCardRepository.findByBatchId(secondaryBatch.getId());
                    if (!secondaryCards.isEmpty()) {
                        for (RechargeCard c : secondaryCards) {
                            c.setBatch(primaryBatch);
                        }
                        rechargeCardRepository.saveAll(secondaryCards);
                        rechargeCardRepository.flush();
                    }

                    // 2. Repoint any order items that referenced secondaryBatch
                    List<SalesOrderItem> secondaryOrderItems = orderItemRepository.findByBatchId(secondaryBatch.getId());
                    if (secondaryOrderItems != null && !secondaryOrderItems.isEmpty()) {
                        for (SalesOrderItem soi : secondaryOrderItems) {
                            soi.setBatch(primaryBatch);
                        }
                        orderItemRepository.saveAll(secondaryOrderItems);
                        orderItemRepository.flush();
                    }

                    // 3. Repoint any campaign items that referenced secondaryBatch
                    List<CampaignExpenseItem> secondaryCampaignItems = campaignExpenseItemRepository.findByBatchId(secondaryBatch.getId());
                    if (secondaryCampaignItems != null && !secondaryCampaignItems.isEmpty()) {
                        for (CampaignExpenseItem cei : secondaryCampaignItems) {
                            cei.setBatch(primaryBatch);
                        }
                        campaignExpenseItemRepository.saveAll(secondaryCampaignItems);
                        campaignExpenseItemRepository.flush();
                    }

                    batchRepository.save(primaryBatch);
                    batchRepository.delete(secondaryBatch);
                    batchRepository.flush();

                    log.info("Successfully merged sequential inventory for {}: [{}] ({} ~ {}) with [{}] ({} ~ {}) => Combined Lot: [{}] ({} ~ {}) (Total: {} cards)",
                            denomination.getName(),
                            primaryBatch.getBatchNumber(), oldPrimaryStart, oldPrimaryEnd,
                            secondaryBatch.getBatchNumber(), oldSecondaryStart, oldSecondaryEnd,
                            primaryBatch.getBatchNumber(), primaryBatch.getStartSerialNumber(), primaryBatch.getEndSerialNumber(),
                            newQty);

                    mergedAny = true;
                    break;
                }
                if (mergedAny) {
                    break;
                }
            }
        } while (mergedAny);
    }

    private static class BatchRange {
        final CardBatch batch;
        final String prefix;
        final long startNum;
        final long endNum;
        final int padLen;

        BatchRange(CardBatch batch, String prefix, long startNum, long endNum, int padLen) {
            this.batch = batch;
            this.prefix = prefix;
            this.startNum = startNum;
            this.endNum = endNum;
            this.padLen = padLen;
        }
    }

    private SalesDto.SalesOrderResponse mapToOrderResponse(SalesOrder o) {
        List<SalesOrderItem> items = orderItemRepository.findByOrderId(o.getId());
        List<SalesDto.OrderItemDto> itemDtos = items.stream().map(i -> SalesDto.OrderItemDto.builder()
                .id(i.getId())
                .denominationId(i.getDenomination().getId())
                .denominationName(i.getDenomination().getName())
                .denominationCode(i.getDenomination().getCode())
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
