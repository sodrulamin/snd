package com.snd.service;

import com.snd.dto.InventoryDto;
import com.snd.model.CardBatch;
import com.snd.model.CardDenomination;
import com.snd.model.RechargeCard;
import com.snd.repository.CardBatchRepository;
import com.snd.repository.CardDenominationRepository;
import com.snd.repository.RechargeCardRepository;
import com.snd.util.CryptoUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
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
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
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
        return batchRepository.findAllByOrderByGeneratedAtDesc().stream().map(this::mapToBatchSummary).collect(Collectors.toList());
    }

    public InventoryDto.BatchSummaryDto getBatchById(Long id) {
        CardBatch batch = batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + id));
        return mapToBatchSummary(batch);
    }

    @Transactional
    public InventoryDto.BatchSummaryDto generateBatch(InventoryDto.BatchGenerateRequest request, String username) {
        CardDenomination denomination = denominationRepository.findById(request.getDenominationId())
                .orElseThrow(() -> new RuntimeException("Card product not found: " + request.getDenominationId()));

        String startSerial = request.getStartSerialNumber() != null ? request.getStartSerialNumber().trim() : null;
        String endSerial = request.getEndSerialNumber() != null ? request.getEndSerialNumber().trim() : null;

        int quantity;
        List<String> generatedSerials = new ArrayList<>();

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

            long count = numEnd - numStart + 1;
            if (count > 10000) {
                throw new IllegalArgumentException("Quantity in serial range (" + count + ") exceeds maximum limit of 10,000 cards per addition");
            }

            quantity = (int) count;
            int padLength = Math.max(numStartStr.length(), numEndStr.length());

            for (long n = numStart; n <= numEnd; n++) {
                String sNum = prefixStart + String.format("%0" + padLength + "d", n);
                if (rechargeCardRepository.existsBySerialNumber(sNum)) {
                    throw new IllegalArgumentException("Serial number '" + sNum + "' already exists in inventory! Please use a non-overlapping serial range.");
                }
                generatedSerials.add(sNum);
            }
        } else if (request.getQuantity() != null && request.getQuantity() > 0) {
            quantity = request.getQuantity();
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            String dateTag = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String batchTag = dateTag + "-" + timestamp.substring(8);
            startSerial = CryptoUtil.generateBatchSerialNumber(denomination.getFaceValue().longValue(), batchTag, 1);
            endSerial = CryptoUtil.generateBatchSerialNumber(denomination.getFaceValue().longValue(), batchTag, quantity);

            for (int i = 1; i <= quantity; i++) {
                generatedSerials.add(CryptoUtil.generateBatchSerialNumber(denomination.getFaceValue().longValue(), batchTag, i));
            }
        } else {
            throw new IllegalArgumentException("Start and End serial numbers are required to add inventory");
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String batchNumber = String.format("LOT-%s-%s", denomination.getFaceValue().intValue(), timestamp);

        LocalDate expiryDate;
        if (request.getAvailableUntil() != null) {
            expiryDate = request.getAvailableUntil();
        } else if (request.getExpiryDate() != null) {
            expiryDate = request.getExpiryDate();
        } else if (request.getValidityDays() != null) {
            expiryDate = LocalDate.now().plusDays(request.getValidityDays());
        } else {
            expiryDate = denomination.getAvailableUntil() != null ? denomination.getAvailableUntil() : LocalDate.now().plusDays(365);
        }

        BigDecimal totalFaceValue = denomination.getFaceValue().multiply(BigDecimal.valueOf(quantity));

        CardBatch batch = CardBatch.builder()
                .batchNumber(batchNumber)
                .denomination(denomination)
                .quantity(quantity)
                .startSerialNumber(startSerial)
                .endSerialNumber(endSerial)
                .totalFaceValue(totalFaceValue)
                .status("AVAILABLE")
                .expiryDate(expiryDate)
                .notes(request.getNotes())
                .createdBy(username)
                .build();

        batch = batchRepository.save(batch);

        List<RechargeCard> cards = new ArrayList<>();
        for (String serialNumber : generatedSerials) {
            RechargeCard card = RechargeCard.builder()
                    .batch(batch)
                    .denomination(denomination)
                    .serialNumber(serialNumber)
                    .status("IN_STOCK")
                    .expiryDate(expiryDate)
                    .build();
            cards.add(card);
        }

        rechargeCardRepository.saveAll(cards);
        return mapToBatchSummary(batch);
    }

    public Page<InventoryDto.CardDetailDto> searchCards(Long batchId, Long denominationId, String status, Long distributorId, String serialNumber, Pageable pageable, boolean includePlainPin) {
        return rechargeCardRepository.searchCards(batchId, denominationId, status, distributorId, serialNumber, pageable)
                .map(card -> mapToCardDetail(card, includePlainPin));
    }

    public byte[] exportCardsCsv(Long batchId, Long orderId, boolean includePlainPin) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
             CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT.builder().setHeader("Serial Number", "Denomination Code", "Denomination", "Face Value", "PIN", "Status", "Expiry Date", "Batch Number").build())) {

            List<RechargeCard> cards;
            if (orderId != null) {
                cards = rechargeCardRepository.findByOrderId(orderId);
            } else if (batchId != null) {
                cards = rechargeCardRepository.findByBatchId(batchId);
            } else {
                cards = new ArrayList<>();
            }

            for (RechargeCard card : cards) {
                String pin = includePlainPin ? CryptoUtil.decryptPin(card.getPinEncrypted()) : card.getPinMasked();
                csvPrinter.printRecord(
                        card.getSerialNumber(),
                        card.getDenomination().getCode(),
                        card.getDenomination().getName(),
                        card.getDenomination().getFaceValue() + " " + card.getDenomination().getCurrency(),
                        pin,
                        card.getStatus(),
                        card.getExpiryDate().toString(),
                        card.getBatch().getBatchNumber()
                );
            }

            csvPrinter.flush();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating CSV export", e);
        }
    }

    private InventoryDto.DenominationResponse mapToDenominationResponse(CardDenomination d) {
        long available = rechargeCardRepository.countByDenominationIdAndStatus(d.getId(), "IN_STOCK");
        long sold = rechargeCardRepository.countByDenominationIdAndStatus(d.getId(), "SOLD");
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
        long inStock = rechargeCardRepository.countByBatchIdAndStatus(b.getId(), "IN_STOCK");
        long sold = rechargeCardRepository.countByBatchIdAndStatus(b.getId(), "SOLD");
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
                .quantity(b.getQuantity())
                .startSerialNumber(b.getStartSerialNumber())
                .endSerialNumber(b.getEndSerialNumber())
                .inStockCount((int) inStock)
                .soldCount((int) sold)
                .totalFaceValue(b.getTotalFaceValue())
                .status(b.getStatus())
                .generatedAt(b.getGeneratedAt())
                .expiryDate(b.getExpiryDate())
                .notes(b.getNotes())
                .createdBy(b.getCreatedBy())
                .build();
    }

    private InventoryDto.CardDetailDto mapToCardDetail(RechargeCard card, boolean includePlainPin) {
        BigDecimal retail = card.getDenomination().getRetailPrice() != null ? card.getDenomination().getRetailPrice() : card.getDenomination().getFaceValue();
        BigDecimal wholesale = card.getDenomination().getWholesalePrice() != null ? card.getDenomination().getWholesalePrice() : retail;

        return InventoryDto.CardDetailDto.builder()
                .id(card.getId())
                .batchId(card.getBatch().getId())
                .batchNumber(card.getBatch().getBatchNumber())
                .denominationId(card.getDenomination().getId())
                .denominationCode(card.getDenomination().getCode())
                .denominationName(card.getDenomination().getName())
                .faceValue(card.getDenomination().getFaceValue())
                .retailPrice(retail)
                .wholesalePrice(wholesale)
                .currency(card.getDenomination().getCurrency())
                .serialNumber(card.getSerialNumber())
                .pinMasked(null)
                .pinPlain(null)
                .status(card.getStatus())
                .distributorId(card.getDistributor() != null ? card.getDistributor().getId() : null)
                .distributorName(card.getDistributor() != null ? card.getDistributor().getFullName() : null)
                .orderId(card.getOrder() != null ? card.getOrder().getId() : null)
                .orderNumber(card.getOrder() != null ? card.getOrder().getOrderNumber() : null)
                .soldAt(card.getSoldAt())
                .redeemedAt(card.getRedeemedAt())
                .expiryDate(card.getExpiryDate())
                .createdAt(card.getCreatedAt())
                .build();
    }

    public InventoryDto.AvailableSerialRangeResponse getAvailableSerialRange(Long denominationId) {
        CardDenomination denomination = denominationRepository.findById(denominationId)
                .orElseThrow(() -> new RuntimeException("Card product not found: " + denominationId));

        List<RechargeCard> availableCards = rechargeCardRepository.findAvailableCardsByDenomination(
                denominationId, PageRequest.of(0, 5000));

        if (availableCards.isEmpty()) {
            return InventoryDto.AvailableSerialRangeResponse.builder()
                    .denominationId(denominationId)
                    .denominationName(denomination.getName())
                    .available(false)
                    .availableCount(0)
                    .build();
        }

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
}
