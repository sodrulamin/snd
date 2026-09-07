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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

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

        String orderNumber = "ORD-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

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

            List<RechargeCard> availableCards = new ArrayList<>();
            String startSerial = itemReq.getStartSerialNumber() != null ? itemReq.getStartSerialNumber().trim() : null;
            String endSerial = itemReq.getEndSerialNumber() != null ? itemReq.getEndSerialNumber().trim() : null;
            int itemQty;

            if (startSerial != null && !startSerial.isEmpty() && endSerial != null && !endSerial.isEmpty()) {
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

                itemQty = (int) (numEnd - numStart + 1);
                int padLength = Math.max(numStartStr.length(), numEndStr.length());

                for (long n = numStart; n <= numEnd; n++) {
                    String sNum = prefixStart + String.format("%0" + padLength + "d", n);
                    RechargeCard card = rechargeCardRepository.findBySerialNumber(sNum)
                            .orElseThrow(() -> new IllegalArgumentException("Card with serial number '" + sNum + "' not found in inventory!"));

                    if (!card.getDenomination().getId().equals(denomination.getId())) {
                        throw new IllegalArgumentException("Card '" + sNum + "' belongs to [" + card.getDenomination().getCode() + "] " + card.getDenomination().getName() + ", not " + denomination.getName());
                    }

                    if (!"IN_STOCK".equalsIgnoreCase(card.getStatus())) {
                        throw new IllegalStateException("Card '" + sNum + "' is already " + card.getStatus() + " and cannot be sold!");
                    }

                    if (itemReq.getBatchId() != null && !card.getBatch().getId().equals(itemReq.getBatchId())) {
                        throw new IllegalArgumentException("Card '" + sNum + "' belongs to lot " + card.getBatch().getBatchNumber() + ", not the selected lot");
                    }

                    availableCards.add(card);
                }
            } else if (itemReq.getQuantity() != null && itemReq.getQuantity() > 0) {
                itemQty = itemReq.getQuantity();
                if (itemReq.getBatchId() != null) {
                    availableCards = rechargeCardRepository.findAvailableCardsByBatch(
                            itemReq.getBatchId(),
                            PageRequest.of(0, itemQty)
                    );
                } else {
                    availableCards = rechargeCardRepository.findAvailableCardsByDenomination(
                            denomination.getId(),
                            PageRequest.of(0, itemQty)
                    );
                }

                if (availableCards.size() < itemQty) {
                    throw new IllegalStateException("Insufficient in-stock cards for product: " + denomination.getName() +
                            ". Requested: " + itemQty + ", Available: " + availableCards.size());
                }
                startSerial = availableCards.get(0).getSerialNumber();
                endSerial = availableCards.get(availableCards.size() - 1).getSerialNumber();
            } else {
                throw new IllegalArgumentException("Start and End serial numbers are required for each card product in the order");
            }

            BigDecimal itemDiscount = itemReq.getItemDiscountPercent() != null ? itemReq.getItemDiscountPercent() : discountPercentage;
            BigDecimal subtotalFace = denomination.getFaceValue().multiply(BigDecimal.valueOf(itemQty));
            BigDecimal itemDiscountAmount = subtotalFace.multiply(itemDiscount).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal subtotalFinal = subtotalFace.subtract(itemDiscountAmount);

            totalCardsCount += itemQty;
            totalFaceValue = totalFaceValue.add(subtotalFace);

            String serialRange = startSerial.equals(endSerial) ? startSerial : (startSerial + " ~ " + endSerial);
            CardBatch itemBatch = availableCards.get(0).getBatch();

            SalesOrderItem orderItem = SalesOrderItem.builder()
                    .order(order)
                    .denomination(denomination)
                    .batch(itemBatch)
                    .quantity(itemQty)
                    .startSerialNumber(startSerial)
                    .endSerialNumber(endSerial)
                    .serialRange(serialRange)
                    .unitFaceValue(denomination.getFaceValue())
                    .subtotalFaceValue(subtotalFace)
                    .itemDiscountPercent(itemDiscount)
                    .subtotalFinal(subtotalFinal)
                    .build();

            orderItems.add(orderItem);
            rangeSummaries.add(denomination.getName() + " (" + itemQty + " cards): " + serialRange);

            LocalDateTime now = LocalDateTime.now();
            for (RechargeCard card : availableCards) {
                card.setStatus("SOLD");
                card.setDistributor(distributor);
                card.setOrder(order);
                card.setSoldAt(now);
                cardsToAllocate.add(card);
            }
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
        order.setItems(orderItems);
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

        cardsToAllocate.stream()
                .map(c -> c.getBatch().getId())
                .distinct()
                .forEach(batchId -> {
                    long remaining = rechargeCardRepository.countByBatchIdAndStatus(batchId, "IN_STOCK");
                    batchRepository.findById(batchId).ifPresent(b -> {
                        if (remaining == 0) {
                            b.setStatus("EXHAUSTED");
                        } else {
                            b.setStatus("PARTIALLY_SOLD");
                        }
                        batchRepository.save(b);
                    });
                });

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
                .companyName("VoIP Global Connect Ltd.")
                .companyAddress("Gulshan-2, Dhaka, Bangladesh")
                .companyPhone("+880-2-9880000")
                .companyEmail("billing@voipglobal.bd")
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
                .startSerialNumber(i.getStartSerialNumber())
                .endSerialNumber(i.getEndSerialNumber())
                .serialRange(i.getSerialRange())
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
}
