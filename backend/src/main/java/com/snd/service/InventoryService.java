package com.snd.service;

import com.snd.dto.InventoryDto;
import com.snd.enums.BatchStatus;
import com.snd.model.CardBatch;
import com.snd.model.CardDenomination;
import com.snd.model.RechargeCard;
import com.snd.repository.CardBatchRepository;
import com.snd.repository.CardDenominationRepository;
import com.snd.repository.RechargeCardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;

import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final CardDenominationRepository denominationRepository;
    private final CardBatchRepository batchRepository;
    private final RechargeCardRepository rechargeCardRepository;

    public List<InventoryDto.DenominationResponse> getAllDenominations() {
        return denominationRepository.findAll().stream().map(this::mapToDenominationResponse).collect(Collectors.toList());
    }

    public List<InventoryDto.DenominationResponse> getActiveDenominations() {
        return denominationRepository.findByIsActiveTrue().stream().map(this::mapToDenominationResponse).collect(Collectors.toList());
    }

    @Transactional
    public InventoryDto.DenominationResponse createDenomination(InventoryDto.DenominationRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (denominationRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Card with code '" + code + "' already exists.");
        }

        LocalDate fromDate = request.getAvailableFrom() != null ? request.getAvailableFrom() : LocalDate.now();
        LocalDate untilDate = request.getAvailableUntil() != null ? request.getAvailableUntil() : fromDate.plusDays(365);

        if (untilDate.isBefore(fromDate)) {
            throw new IllegalArgumentException("Available until date cannot be before available from date.");
        }

        BigDecimal retailPrice = request.getRetailPrice() != null ? request.getRetailPrice() : request.getFaceValue();
        BigDecimal faceValue = retailPrice;
        BigDecimal wholesalePrice = request.getWholesalePrice() != null ? request.getWholesalePrice() : retailPrice;
        int validityDays = (int) ChronoUnit.DAYS.between(fromDate, untilDate);

        CardDenomination denomination = CardDenomination.builder()
            .code(code)
            .name(request.getName().trim())
            .retailPrice(retailPrice)
            .wholesalePrice(wholesalePrice)
            .availableFrom(fromDate)
            .availableUntil(untilDate)
            .faceValue(faceValue)
            .currency(request.getCurrency() != null ? request.getCurrency() : "BDT")
            .validityDays(validityDays > 0 ? validityDays : 365)
            .description(request.getDescription())
            .isActive(request.getIsActive() == null || request.getIsActive())
            .build();

        denomination = denominationRepository.save(denomination);
        return mapToDenominationResponse(denomination);
    }

    @Transactional
    public InventoryDto.DenominationResponse updateDenomination(Long id, InventoryDto.DenominationRequest request) {
        CardDenomination denomination = denominationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Card denomination not found: " + id));

        String newCode = request.getCode().trim().toUpperCase();
        if (!newCode.equalsIgnoreCase(denomination.getCode()) && denominationRepository.existsByCode(newCode)) {
            throw new IllegalArgumentException("Card with code '" + newCode + "' already exists.");
        }

        LocalDate fromDate = request.getAvailableFrom() != null ? request.getAvailableFrom() : denomination.getAvailableFrom();
        LocalDate untilDate = request.getAvailableUntil() != null ? request.getAvailableUntil() : denomination.getAvailableUntil();

        if (untilDate.isBefore(fromDate)) {
            throw new IllegalArgumentException("Available until date cannot be before available from date.");
        }

        BigDecimal retailPrice = request.getRetailPrice() != null ? request.getRetailPrice() : request.getFaceValue();
        BigDecimal faceValue = retailPrice;
        BigDecimal wholesalePrice = request.getWholesalePrice() != null ? request.getWholesalePrice() : retailPrice;
        int validityDays = (int) ChronoUnit.DAYS.between(fromDate, untilDate);

        denomination.setCode(newCode);
        denomination.setName(request.getName().trim());
        denomination.setRetailPrice(retailPrice);
        denomination.setWholesalePrice(wholesalePrice);
        denomination.setAvailableFrom(fromDate);
        denomination.setAvailableUntil(untilDate);
        denomination.setFaceValue(faceValue);
        denomination.setValidityDays(validityDays > 0 ? validityDays : 365);

        if (request.getCurrency() != null) denomination.setCurrency(request.getCurrency());
        denomination.setDescription(request.getDescription());
        if (request.getIsActive() != null) denomination.setIsActive(request.getIsActive());

        denomination = denominationRepository.save(denomination);
        return mapToDenominationResponse(denomination);
    }


    @Transactional
    public void deleteDenomination(Long id) {
        CardDenomination denomination = denominationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Card product not found: " + id));

        long batchCount = batchRepository.countByDenominationId(id);
        if (batchCount > 0) {
            throw new IllegalStateException("Cannot delete card '" + denomination.getName() + "' because " + batchCount + " batch(es) have already been generated for it. You can deactivate the card instead.");
        }

        denominationRepository.delete(denomination);
    }

    public List<InventoryDto.BatchSummaryDto> getAllBatches() {
        return batchRepository.findByStatusOrderByGeneratedAtDesc(BatchStatus.AVAILABLE).stream().map(this::mapToBatchSummary).collect(Collectors.toList());
    }

    public Page<InventoryDto.BatchSummaryDto> getBatches(
            Pageable pageable, String statusStr, List<Long> denominationIds, List<String> batchNumbers, String search) {
        BatchStatus status = null;
        if (statusStr != null && !statusStr.isBlank() && !"ALL".equalsIgnoreCase(statusStr)) {
            try {
                status = BatchStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        List<Long> cleanDenomIds = (denominationIds != null && !denominationIds.isEmpty()) ? denominationIds : null;
        List<String> cleanBatchNumbers = (batchNumbers != null && !batchNumbers.isEmpty()) ? batchNumbers : null;

        return batchRepository.findBatchesFiltered(status, cleanDenomIds, cleanBatchNumbers, cleanSearch, pageable)
            .map(this::mapToBatchSummary);
    }

    public List<InventoryDto.BatchSummaryDto> getBatchesFilteredList(
            String statusStr, List<Long> denominationIds, List<String> batchNumbers, String search) {
        BatchStatus status = null;
        if (statusStr != null && !statusStr.isBlank() && !"ALL".equalsIgnoreCase(statusStr)) {
            try {
                status = BatchStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        List<Long> cleanDenomIds = (denominationIds != null && !denominationIds.isEmpty()) ? denominationIds : null;
        List<String> cleanBatchNumbers = (batchNumbers != null && !batchNumbers.isEmpty()) ? batchNumbers : null;

        return batchRepository.findBatchesFilteredList(status, cleanDenomIds, cleanBatchNumbers, cleanSearch)
            .stream()
            .map(this::mapToBatchSummary)
            .collect(Collectors.toList());
    }

    public List<String> getDistinctBatchNumbers(String statusStr, List<Long> denominationIds) {
        BatchStatus status = null;
        if (statusStr != null && !statusStr.isBlank() && !"ALL".equalsIgnoreCase(statusStr)) {
            try {
                status = BatchStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        List<Long> cleanDenomIds = (denominationIds != null && !denominationIds.isEmpty()) ? denominationIds : null;
        return batchRepository.findDistinctBatchNumbersByStatusAndDenominations(status, cleanDenomIds);
    }

    public List<InventoryDto.DenominationResponse> getDistinctDenominations(String statusStr) {
        BatchStatus status = null;
        if (statusStr != null && !statusStr.isBlank() && !"ALL".equalsIgnoreCase(statusStr)) {
            try {
                status = BatchStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        return batchRepository.findDistinctDenominationsByStatus(status)
            .stream()
            .map(this::mapToDenominationResponse)
            .collect(Collectors.toList());
    }

    public InventoryDto.InventorySummaryDto getInventorySummary() {
        List<CardBatch> availableBatches = batchRepository.findByStatus(BatchStatus.AVAILABLE);
        long totalLots = availableBatches.size();
        long inStockCards = 0;
        BigDecimal totalWholesaleValue = BigDecimal.ZERO;
        BigDecimal totalRetailValue = BigDecimal.ZERO;

        for (CardBatch b : availableBatches) {
            InventoryDto.BatchSummaryDto dto = mapToBatchSummary(b);
            long qty = dto.getInStockCount() != null ? dto.getInStockCount() : (dto.getQuantity() != null ? dto.getQuantity() : 0);
            inStockCards += qty;

            BigDecimal unitWholesale = dto.getWholesalePrice() != null ? dto.getWholesalePrice() : (dto.getFaceValue() != null ? dto.getFaceValue() : BigDecimal.ZERO);
            BigDecimal unitRetail = dto.getRetailPrice() != null ? dto.getRetailPrice() : (dto.getFaceValue() != null ? dto.getFaceValue() : BigDecimal.ZERO);

            totalWholesaleValue = totalWholesaleValue.add(unitWholesale.multiply(BigDecimal.valueOf(qty)));
            totalRetailValue = totalRetailValue.add(unitRetail.multiply(BigDecimal.valueOf(qty)));
        }

        return InventoryDto.InventorySummaryDto.builder()
            .totalLots(totalLots)
            .inStockCards(inStockCards)
            .totalWholesaleValue(totalWholesaleValue)
            .totalRetailValue(totalRetailValue)
            .build();
    }

    public List<InventoryDto.BatchSummaryDto> getBatchesByStatus(String status) {
        if (status == null || "ALL".equalsIgnoreCase(status)) {
            return batchRepository.findAllByOrderByGeneratedAtDesc().stream().map(this::mapToBatchSummary).collect(Collectors.toList());
        }
        try {
            BatchStatus batchStatus = BatchStatus.valueOf(status.toUpperCase());
            return batchRepository.findByStatusOrderByGeneratedAtDesc(batchStatus).stream().map(this::mapToBatchSummary).collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            return java.util.Collections.emptyList();
        }
    }

    public InventoryDto.BatchSummaryDto getBatchById(Long id) {
        CardBatch batch = batchRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Batch not found: " + id));
        return mapToBatchSummary(batch);
    }

    public List<InventoryDto.CardDetailDto> getBatchCards(Long batchId) {
        CardBatch batch = batchRepository.findById(batchId)
            .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));

        List<RechargeCard> existingCards = rechargeCardRepository.findByBatchId(batchId);
        java.util.Map<String, RechargeCard> cardMap = new java.util.HashMap<>();
        for (RechargeCard c : existingCards) {
            if (c.getSerialNumber() != null) {
                cardMap.put(c.getSerialNumber(), c);
            }
        }

        List<InventoryDto.CardDetailDto> result = new ArrayList<>();
        String startSerial = batch.getStartSerialNumber();
        String endSerial = batch.getEndSerialNumber();

        Pattern pattern = Pattern.compile("^(.*?)(\\d+)$");
        Matcher mStart = StringUtils.hasText(startSerial) ? pattern.matcher(startSerial.trim()) : null;
        Matcher mEnd = StringUtils.hasText(endSerial) ? pattern.matcher(endSerial.trim()) : null;

        if (mStart != null && mEnd != null && mStart.matches() && mEnd.matches() && mStart.group(1).equals(mEnd.group(1))) {
            String prefix = mStart.group(1);
            String startDigits = mStart.group(2);
            String endDigits = mEnd.group(2);
            int padLen = Math.max(startDigits.length(), endDigits.length());
            long startNum = Long.parseLong(startDigits);
            long endNum = Long.parseLong(endDigits);

            for (long n = startNum; n <= endNum; n++) {
                String sNum = prefix + String.format("%0" + padLen + "d", n);
                RechargeCard card = cardMap.get(sNum);

                String status = card != null && card.getStatus() != null 
                    ? card.getStatus() 
                    : (batch.getStatus() != null && batch.getStatus() != BatchStatus.AVAILABLE ? batch.getStatus().name() : "IN_STOCK");

                result.add(InventoryDto.CardDetailDto.builder()
                    .id(card != null ? card.getId() : null)
                    .batchId(batch.getId())
                    .batchNumber(batch.getBatchNumber())
                    .denominationId(batch.getDenomination().getId())
                    .denominationCode(batch.getDenomination().getCode())
                    .denominationName(batch.getDenomination().getName())
                    .faceValue(batch.getDenomination().getFaceValue())
                    .retailPrice(batch.getDenomination().getRetailPrice())
                    .wholesalePrice(batch.getDenomination().getWholesalePrice())
                    .currency(batch.getDenomination().getCurrency())
                    .serialNumber(sNum)
                    .pinMasked(card != null ? card.getPinMasked() : null)
                    .status(status)
                    .distributorId(card != null && card.getDistributor() != null ? card.getDistributor().getId() : null)
                    .distributorName(card != null && card.getDistributor() != null ? card.getDistributor().getFullName() : null)
                    .orderId(card != null && card.getOrder() != null ? card.getOrder().getId() : null)
                    .orderNumber(card != null && card.getOrder() != null ? card.getOrder().getOrderNumber() : null)
                    .soldAt(card != null ? card.getSoldAt() : null)
                    .redeemedAt(card != null ? card.getRedeemedAt() : null)
                    .expiryDate(card != null && card.getExpiryDate() != null ? card.getExpiryDate() : batch.getDenomination().getAvailableUntil())
                    .createdAt(card != null ? card.getCreatedAt() : batch.getGeneratedAt())
                    .build());
            }
        } else {
            // Fallback: If serial pattern isn't parseable, populate from existing rechargeCard records
            for (RechargeCard card : existingCards) {
                result.add(InventoryDto.CardDetailDto.builder()
                    .id(card.getId())
                    .batchId(batch.getId())
                    .batchNumber(batch.getBatchNumber())
                    .denominationId(batch.getDenomination().getId())
                    .denominationCode(batch.getDenomination().getCode())
                    .denominationName(batch.getDenomination().getName())
                    .faceValue(batch.getDenomination().getFaceValue())
                    .retailPrice(batch.getDenomination().getRetailPrice())
                    .wholesalePrice(batch.getDenomination().getWholesalePrice())
                    .currency(batch.getDenomination().getCurrency())
                    .serialNumber(card.getSerialNumber())
                    .pinMasked(card.getPinMasked())
                    .status(card.getStatus())
                    .distributorId(card.getDistributor() != null ? card.getDistributor().getId() : null)
                    .distributorName(card.getDistributor() != null ? card.getDistributor().getFullName() : null)
                    .orderId(card.getOrder() != null ? card.getOrder().getId() : null)
                    .orderNumber(card.getOrder() != null ? card.getOrder().getOrderNumber() : null)
                    .soldAt(card.getSoldAt())
                    .redeemedAt(card.getRedeemedAt())
                    .expiryDate(card.getExpiryDate())
                    .createdAt(card.getCreatedAt())
                    .build());
            }
        }

        return result;
    }

    public List<InventoryDto.CardDetailDto> getLotCards(String batchNumber) {
        List<CardBatch> batches = batchRepository.findByBatchNumberOrderByGeneratedAtDesc(batchNumber);
        if (batches.isEmpty()) {
            throw new RuntimeException("Inventory lot not found: " + batchNumber);
        }

        // Aggregate cards across all batch slices belonging to this lot number
        List<InventoryDto.CardDetailDto> allCards = new ArrayList<>();
        for (CardBatch b : batches) {
            allCards.addAll(getBatchCards(b.getId()));
        }

        // Sort by serialNumber ascending so contiguous sequences are grouped correctly
        allCards.sort((c1, c2) -> {
            String s1 = c1.getSerialNumber() != null ? c1.getSerialNumber() : "";
            String s2 = c2.getSerialNumber() != null ? c2.getSerialNumber() : "";
            return s1.compareTo(s2);
        });

        return allCards;
    }

    public List<InventoryDto.BatchSerialRangeDto> getLotSerialRanges(String batchNumber) {
        List<CardBatch> batches = batchRepository.findByBatchNumberOrderByGeneratedAtDesc(batchNumber);
        if (batches.isEmpty()) {
            throw new RuntimeException("Inventory lot not found: " + batchNumber);
        }

        CardBatch firstBatch = batches.get(0);
        List<InventoryDto.CardDetailDto> cards = getLotCards(batchNumber);
        List<InventoryDto.BatchSerialRangeDto> ranges = new ArrayList<>();
        if (cards.isEmpty()) {
            return ranges;
        }

        BigDecimal unitWholesale = firstBatch.getDenomination().getWholesalePrice() != null 
            ? firstBatch.getDenomination().getWholesalePrice() 
            : firstBatch.getDenomination().getFaceValue();
        BigDecimal unitRetail = firstBatch.getDenomination().getRetailPrice() != null 
            ? firstBatch.getDenomination().getRetailPrice() 
            : firstBatch.getDenomination().getFaceValue();

        InventoryDto.CardDetailDto rangeStart = cards.get(0);
        InventoryDto.CardDetailDto prevCard = cards.get(0);
        int currentRangeQty = 1;

        for (int i = 1; i < cards.size(); i++) {
            InventoryDto.CardDetailDto current = cards.get(i);
            boolean sameStatus = Objects.equals(current.getStatus(), rangeStart.getStatus());
            boolean sameDistributor = Objects.equals(current.getDistributorId(), rangeStart.getDistributorId());
            boolean sameOrder = Objects.equals(current.getOrderId(), rangeStart.getOrderId());

            if (sameStatus && sameDistributor && sameOrder) {
                currentRangeQty++;
                prevCard = current;
            } else {
                // Finish current range block
                ranges.add(InventoryDto.BatchSerialRangeDto.builder()
                    .batchId(firstBatch.getId())
                    .batchNumber(batchNumber)
                    .denominationId(firstBatch.getDenomination().getId())
                    .denominationCode(firstBatch.getDenomination().getCode())
                    .denominationName(firstBatch.getDenomination().getName())
                    .startSerialNumber(rangeStart.getSerialNumber())
                    .endSerialNumber(prevCard.getSerialNumber())
                    .quantity(currentRangeQty)
                    .status(rangeStart.getStatus())
                    .distributorId(rangeStart.getDistributorId())
                    .distributorName(rangeStart.getDistributorName())
                    .orderId(rangeStart.getOrderId())
                    .orderNumber(rangeStart.getOrderNumber())
                    .unitWholesalePrice(unitWholesale)
                    .totalWholesalePrice(unitWholesale.multiply(BigDecimal.valueOf(currentRangeQty)))
                    .unitRetailPrice(unitRetail)
                    .totalRetailPrice(unitRetail.multiply(BigDecimal.valueOf(currentRangeQty)))
                    .build());

                rangeStart = current;
                prevCard = current;
                currentRangeQty = 1;
            }
        }

        // Add final range block
        ranges.add(InventoryDto.BatchSerialRangeDto.builder()
            .batchId(firstBatch.getId())
            .batchNumber(batchNumber)
            .denominationId(firstBatch.getDenomination().getId())
            .denominationCode(firstBatch.getDenomination().getCode())
            .denominationName(firstBatch.getDenomination().getName())
            .startSerialNumber(rangeStart.getSerialNumber())
            .endSerialNumber(prevCard.getSerialNumber())
            .quantity(currentRangeQty)
            .status(rangeStart.getStatus())
            .distributorId(rangeStart.getDistributorId())
            .distributorName(rangeStart.getDistributorName())
            .orderId(rangeStart.getOrderId())
            .orderNumber(rangeStart.getOrderNumber())
            .unitWholesalePrice(unitWholesale)
            .totalWholesalePrice(unitWholesale.multiply(BigDecimal.valueOf(currentRangeQty)))
            .unitRetailPrice(unitRetail)
            .totalRetailPrice(unitRetail.multiply(BigDecimal.valueOf(currentRangeQty)))
            .build());

        return ranges;
    }

    public List<InventoryDto.BatchSerialRangeDto> getBatchSerialRanges(Long batchId) {
        CardBatch batch = batchRepository.findById(batchId)
            .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));

        List<InventoryDto.CardDetailDto> cards = getBatchCards(batchId);
        List<InventoryDto.BatchSerialRangeDto> ranges = new ArrayList<>();
        if (cards.isEmpty()) {
            return ranges;
        }

        BigDecimal unitWholesale = batch.getDenomination().getWholesalePrice() != null 
            ? batch.getDenomination().getWholesalePrice() 
            : batch.getDenomination().getFaceValue();
        BigDecimal unitRetail = batch.getDenomination().getRetailPrice() != null 
            ? batch.getDenomination().getRetailPrice() 
            : batch.getDenomination().getFaceValue();

        InventoryDto.CardDetailDto rangeStart = cards.get(0);
        InventoryDto.CardDetailDto prevCard = cards.get(0);
        int currentRangeQty = 1;

        for (int i = 1; i < cards.size(); i++) {
            InventoryDto.CardDetailDto current = cards.get(i);
            boolean sameStatus = Objects.equals(current.getStatus(), rangeStart.getStatus());
            boolean sameDistributor = Objects.equals(current.getDistributorId(), rangeStart.getDistributorId());
            boolean sameOrder = Objects.equals(current.getOrderId(), rangeStart.getOrderId());

            if (sameStatus && sameDistributor && sameOrder) {
                currentRangeQty++;
                prevCard = current;
            } else {
                // Finish current range block
                ranges.add(InventoryDto.BatchSerialRangeDto.builder()
                    .batchId(batch.getId())
                    .batchNumber(batch.getBatchNumber())
                    .denominationId(batch.getDenomination().getId())
                    .denominationCode(batch.getDenomination().getCode())
                    .denominationName(batch.getDenomination().getName())
                    .startSerialNumber(rangeStart.getSerialNumber())
                    .endSerialNumber(prevCard.getSerialNumber())
                    .quantity(currentRangeQty)
                    .status(rangeStart.getStatus())
                    .distributorId(rangeStart.getDistributorId())
                    .distributorName(rangeStart.getDistributorName())
                    .orderId(rangeStart.getOrderId())
                    .orderNumber(rangeStart.getOrderNumber())
                    .unitWholesalePrice(unitWholesale)
                    .totalWholesalePrice(unitWholesale.multiply(BigDecimal.valueOf(currentRangeQty)))
                    .unitRetailPrice(unitRetail)
                    .totalRetailPrice(unitRetail.multiply(BigDecimal.valueOf(currentRangeQty)))
                    .build());

                rangeStart = current;
                prevCard = current;
                currentRangeQty = 1;
            }
        }

        // Add final range block
        ranges.add(InventoryDto.BatchSerialRangeDto.builder()
            .batchId(batch.getId())
            .batchNumber(batch.getBatchNumber())
            .denominationId(batch.getDenomination().getId())
            .denominationCode(batch.getDenomination().getCode())
            .denominationName(batch.getDenomination().getName())
            .startSerialNumber(rangeStart.getSerialNumber())
            .endSerialNumber(prevCard.getSerialNumber())
            .quantity(currentRangeQty)
            .status(rangeStart.getStatus())
            .distributorId(rangeStart.getDistributorId())
            .distributorName(rangeStart.getDistributorName())
            .orderId(rangeStart.getOrderId())
            .orderNumber(rangeStart.getOrderNumber())
            .unitWholesalePrice(unitWholesale)
            .totalWholesalePrice(unitWholesale.multiply(BigDecimal.valueOf(currentRangeQty)))
            .unitRetailPrice(unitRetail)
            .totalRetailPrice(unitRetail.multiply(BigDecimal.valueOf(currentRangeQty)))
            .build());

        return ranges;
    }

    @Transactional
    public InventoryDto.BatchSummaryDto generateBatch(InventoryDto.BatchGenerateRequest request, String username) {
        CardDenomination denomination = denominationRepository.findById(request.getDenominationId())
            .orElseThrow(() -> new RuntimeException("Card product not found: " + request.getDenominationId()));

        String startSerial = request.getStartSerialNumber() != null ? request.getStartSerialNumber().trim() : null;
        String endSerial = request.getEndSerialNumber() != null ? request.getEndSerialNumber().trim() : null;

        if (!StringUtils.hasText(startSerial) || !StringUtils.hasText(endSerial)) {
            log.error("Invalid serial input. Start: '{}' End: '{}'", startSerial, endSerial);
            throw new IllegalArgumentException("Start and End serial numbers are required to add inventory");
        }

        Pattern pattern = Pattern.compile("^(.*?)(\\d+)$");
        Matcher mStart = pattern.matcher(startSerial);
        Matcher mEnd = pattern.matcher(endSerial);

        if (!mStart.matches() || !mEnd.matches()) {
            log.error("Invalid serial value. Start: '{}', End: '{}'", startSerial, endSerial);
            throw new IllegalArgumentException("Start and End serial numbers must end with numeric digits (e.g. 100001 or SN-100-0001)");
        }

        String prefixStart = mStart.group(1);
        String numStartStr = mStart.group(2);
        String prefixEnd = mEnd.group(1);
        String numEndStr = mEnd.group(2);

        if (!prefixStart.equals(prefixEnd)) {
            log.error("Invalid prefix value. Start: '{}', End: '{}'", startSerial, endSerial);
            throw new IllegalArgumentException("Start and End serial numbers must have the same prefix (found '" + prefixStart + "' and '" + prefixEnd + "')");
        }

        long numStart = Long.parseLong(numStartStr);
        long numEnd = Long.parseLong(numEndStr);

        if (numEnd < numStart) {
            log.error("Invalid range value. Start: '{}', End: '{}'", startSerial, endSerial);
            throw new IllegalArgumentException("End serial number (" + endSerial + ") cannot be less than start serial number (" + startSerial + ")");
        }

        long count = numEnd - numStart + 1;
        int quantity = (int) count;

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        String batchNumber = String.format("LOT-%s-%s", denomination.getFaceValue().intValue(), timestamp);

        BigDecimal totalPrice = denomination.getFaceValue().multiply(BigDecimal.valueOf(quantity));

        CardBatch batch = CardBatch.builder()
            .batchNumber(batchNumber)
            .denomination(denomination)
            .quantity(quantity)
            .startSerialNumber(startSerial)
            .endSerialNumber(endSerial)
            .totalFaceValue(totalPrice)
            .status(BatchStatus.AVAILABLE)
            .notes(request.getNotes())
            .createdBy(username)
            .build();

        batch = batchRepository.save(batch);

        return mapToBatchSummary(batch);
    }

    private InventoryDto.DenominationResponse mapToDenominationResponse(CardDenomination d) {
        List<CardBatch> batches = batchRepository.findByDenominationIdAndStatus(d.getId(), BatchStatus.AVAILABLE);
        long available = 0;
        for (CardBatch b : batches) {
            long batchCount = 0;
            if (StringUtils.hasText(b.getStartSerialNumber()) && StringUtils.hasText(b.getEndSerialNumber())) {
                try {
                    Pattern pattern = Pattern.compile("^(.*?)(\\d+)$");
                    Matcher mStart = pattern.matcher(b.getStartSerialNumber().trim());
                    Matcher mEnd = pattern.matcher(b.getEndSerialNumber().trim());
                    if (mStart.matches() && mEnd.matches() && mStart.group(1).equals(mEnd.group(1))) {
                        long start = Long.parseLong(mStart.group(2));
                        long end = Long.parseLong(mEnd.group(2));
                        if (end >= start) {
                            batchCount = end - start + 1;
                        }
                    }
                } catch (Exception ignored) {}
            }
            if (batchCount == 0 && b.getQuantity() != null) {
                batchCount = b.getQuantity();
            }
            available += batchCount;
        }

        if (available == 0) {
            available = rechargeCardRepository.countByDenominationIdAndStatus(d.getId(), "IN_STOCK");
        }
        long sold = rechargeCardRepository.countByDenominationIdAndStatus(d.getId(), "SOLD");
        if (sold == 0) {
            List<CardBatch> soldBatches = batchRepository.findByDenominationIdAndStatus(d.getId(), BatchStatus.SOLD);
            for (CardBatch b : soldBatches) {
                sold += (b.getQuantity() != null ? b.getQuantity() : 0);
            }
        }
        BigDecimal retail = d.getRetailPrice() != null ? d.getRetailPrice() : d.getFaceValue();
        BigDecimal wholesale = d.getWholesalePrice() != null ? d.getWholesalePrice() : retail;

        return InventoryDto.DenominationResponse.builder()
            .id(d.getId())
            .code(d.getCode())
            .name(d.getName())
            .retailPrice(retail)
            .wholesalePrice(wholesale)
            .availableFrom(d.getAvailableFrom())
            .availableUntil(d.getAvailableUntil())
            .faceValue(d.getFaceValue())
            .currency(d.getCurrency())
            .validityDays(d.getValidityDays())
            .description(d.getDescription())
            .isActive(d.getIsActive())
            .availableStock(available)
            .totalCardsGenerated(available + sold)
            .totalCardsSold(sold)
            .build();
    }

    private InventoryDto.BatchSummaryDto mapToBatchSummary(CardBatch b) {
        long count = 0;
        if (StringUtils.hasText(b.getStartSerialNumber()) && StringUtils.hasText(b.getEndSerialNumber())) {
            try {
                Pattern pattern = Pattern.compile("^(.*?)(\\d+)$");
                Matcher mStart = pattern.matcher(b.getStartSerialNumber().trim());
                Matcher mEnd = pattern.matcher(b.getEndSerialNumber().trim());
                if (mStart.matches() && mEnd.matches() && mStart.group(1).equals(mEnd.group(1))) {
                    long start = Long.parseLong(mStart.group(2));
                    long end = Long.parseLong(mEnd.group(2));
                    if (end >= start) {
                        count = end - start + 1;
                    }
                }
            } catch (Exception e) {
                log.warn("Could not calculate inStock from serial range for batch {}: {}", b.getBatchNumber(), e.getMessage());
            }
        }
        if (count == 0 && b.getQuantity() != null) {
            count = b.getQuantity();
        }

        long inStock = b.getStatus() == BatchStatus.SOLD ? 0 : count;
        long sold = b.getStatus() == BatchStatus.SOLD ? count : 0;

        log.info("Batch id: {} number: {} status: {} in stock: {} sold: {}", b.getId(), b.getBatchNumber(), b.getStatus(), inStock, sold);

        BigDecimal retail = b.getDenomination().getRetailPrice() != null ? b.getDenomination().getRetailPrice() : b.getDenomination().getFaceValue();
        BigDecimal wholesale = b.getDenomination().getWholesalePrice() != null ? b.getDenomination().getWholesalePrice() : retail;

        return InventoryDto.BatchSummaryDto.builder()
            .id(b.getId())
            .batchNumber(b.getBatchNumber())
            .denominationId(b.getDenomination().getId())
            .denominationCode(b.getDenomination().getCode())
            .denominationName(b.getDenomination().getName())
            .faceValue(b.getDenomination().getFaceValue())
            .retailPrice(retail)
            .wholesalePrice(wholesale)
            .currency(b.getDenomination().getCurrency())
            .quantity((int) count)
            .startSerialNumber(b.getStartSerialNumber())
            .endSerialNumber(b.getEndSerialNumber())
            .inStockCount((int) inStock)
            .soldCount((int) sold)
            .totalFaceValue(b.getTotalFaceValue())
            .status(b.getStatus())
            .generatedAt(b.getGeneratedAt())
            .notes(b.getNotes())
            .createdBy(b.getCreatedBy())
            .build();
    }

    public InventoryDto.AvailableSerialRangeResponse getAvailableSerialRange(Long denominationId) {
        CardDenomination denomination = denominationRepository.findById(denominationId)
            .orElseThrow(() -> new RuntimeException("Card product not found: " + denominationId));

        List<RechargeCard> availableCards = rechargeCardRepository.findAvailableCardsByDenomination(
            denominationId, PageRequest.of(0, 5000));

        if (!availableCards.isEmpty()) {
            RechargeCard firstCard = availableCards.get(0);
            Long targetBatchId = firstCard.getBatch() != null ? firstCard.getBatch().getId() : null;

            List<RechargeCard> batchRun = new ArrayList<>();
            for (RechargeCard card : availableCards) {
                Long cBatchId = card.getBatch() != null ? card.getBatch().getId() : null;
                if (Objects.equals(cBatchId, targetBatchId)) {
                    batchRun.add(card);
                } else {
                    break;
                }
            }

            RechargeCard lastCard = batchRun.get(batchRun.size() - 1);

            return InventoryDto.AvailableSerialRangeResponse.builder()
                .denominationId(denominationId)
                .denominationName(denomination.getName())
                .available(true)
                .startSerialNumber(firstCard.getSerialNumber())
                .endSerialNumber(lastCard.getSerialNumber())
                .availableCount(batchRun.size())
                .batchNumber(firstCard.getBatch() != null ? firstCard.getBatch().getBatchNumber() : null)
                .build();
        }

        List<CardBatch> batches = batchRepository.findByDenominationIdAndStatus(denominationId, BatchStatus.AVAILABLE);
        if (!batches.isEmpty()) {
            CardBatch b = batches.get(0);
            long count = b.getQuantity() != null ? b.getQuantity() : 0;
            if (StringUtils.hasText(b.getStartSerialNumber()) && StringUtils.hasText(b.getEndSerialNumber())) {
                try {
                    Pattern pattern = Pattern.compile("^(.*?)(\\d+)$");
                    Matcher mStart = pattern.matcher(b.getStartSerialNumber().trim());
                    Matcher mEnd = pattern.matcher(b.getEndSerialNumber().trim());
                    if (mStart.matches() && mEnd.matches() && mStart.group(1).equals(mEnd.group(1))) {
                        long start = Long.parseLong(mStart.group(2));
                        long end = Long.parseLong(mEnd.group(2));
                        if (end >= start) {
                            count = end - start + 1;
                        }
                    }
                } catch (Exception ignored) {}
            }
            return InventoryDto.AvailableSerialRangeResponse.builder()
                .denominationId(denominationId)
                .denominationName(denomination.getName())
                .available(true)
                .startSerialNumber(b.getStartSerialNumber())
                .endSerialNumber(b.getEndSerialNumber())
                .availableCount((int) count)
                .batchNumber(b.getBatchNumber())
                .build();
        }

        return InventoryDto.AvailableSerialRangeResponse.builder()
            .denominationId(denominationId)
            .denominationName(denomination.getName())
            .available(false)
            .availableCount(0)
            .build();
    }

    @Transactional
    public void deleteBatch(Long id) {
        CardBatch batch = batchRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Inventory lot not found: " + id));

        if (batch.getStatus() == BatchStatus.SOLD) {
            throw new IllegalStateException("Cannot delete inventory lot '" + batch.getBatchNumber() + "' because it has already been sold.");
        }

        long soldCount = rechargeCardRepository.countByBatchIdAndStatus(id, "SOLD");
        long allocatedCount = rechargeCardRepository.countByBatchIdAndStatus(id, "ALLOCATED");
        if (soldCount > 0 || allocatedCount > 0) {
            throw new IllegalStateException("Cannot delete inventory lot '" + batch.getBatchNumber() + "' because " + (soldCount + allocatedCount) + " card(s) have already been sold or allocated to sales orders.");
        }

        List<RechargeCard> cards = rechargeCardRepository.findByBatchId(id);
        rechargeCardRepository.deleteAll(cards);
        batchRepository.delete(batch);
    }
}
