package com.snd.service;

import com.snd.dto.CampaignExpenseDto;
import com.snd.enums.BatchStatus;
import com.snd.model.CampaignExpense;
import com.snd.model.CampaignExpenseItem;
import com.snd.model.CardBatch;
import com.snd.model.CardDenomination;
import com.snd.model.RechargeCard;
import com.snd.repository.CampaignExpenseItemRepository;
import com.snd.repository.CampaignExpenseRepository;
import com.snd.repository.CardBatchRepository;
import com.snd.repository.CardDenominationRepository;
import com.snd.repository.RechargeCardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

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

@Service
@RequiredArgsConstructor
@Slf4j
public class CampaignExpenseService {

    private final CampaignExpenseRepository campaignExpenseRepository;
    private final CampaignExpenseItemRepository campaignExpenseItemRepository;
    private final CardDenominationRepository denominationRepository;
    private final CardBatchRepository batchRepository;
    private final RechargeCardRepository rechargeCardRepository;

    private static final Pattern SERIAL_PATTERN = Pattern.compile("^(.*?)(\\d+)$");

    @Transactional
    public CampaignExpenseDto.CampaignExpenseResponse createCampaignExpense(
            CampaignExpenseDto.CreateCampaignExpenseRequest request, String createdByUsername) {

        String refNo = request.getReferenceNo();
        if (!StringUtils.hasText(refNo)) {
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
            int randomSuffix = java.util.concurrent.ThreadLocalRandom.current().nextInt(100, 999);
            refNo = "CMP-" + timestamp + "-" + randomSuffix;
            while (campaignExpenseRepository.existsByReferenceNo(refNo)) {
                randomSuffix = java.util.concurrent.ThreadLocalRandom.current().nextInt(100, 999);
                refNo = "CMP-" + timestamp + "-" + randomSuffix;
            }
        } else {
            refNo = refNo.trim().toUpperCase();
            if (campaignExpenseRepository.existsByReferenceNo(refNo)) {
                throw new IllegalArgumentException("Reference number '" + refNo + "' already exists.");
            }
        }

        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new IllegalArgumentException("Both campaign start date and end date are required.");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Campaign end date cannot be before start date.");
        }

        LocalDateTime disbursedTime = request.getDisbursedAt() != null ? request.getDisbursedAt() : LocalDateTime.now();
        String category = request.getPurposeCategory() != null ? request.getPurposeCategory().trim().toUpperCase() : "CAMPAIGN";

        CampaignExpense expense = CampaignExpense.builder()
                .referenceNo(refNo)
                .campaignName(request.getCampaignName().trim())
                .purposeCategory(category)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .beneficiaryDept(request.getBeneficiaryDept() != null ? request.getBeneficiaryDept().trim() : null)
                .disbursedAt(disbursedTime)
                .disbursedBy(createdByUsername)
                .notes(request.getNotes())
                .totalCardsCount(0)
                .totalWholesaleCost(BigDecimal.ZERO)
                .totalFaceValue(BigDecimal.ZERO)
                .costVarianceAmount(BigDecimal.ZERO)
                .build();

        CampaignExpense savedExpense = campaignExpenseRepository.save(expense);

        List<CampaignExpenseItem> items = new ArrayList<>();
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            items = processAndDisburseItems(savedExpense, request.getItems(), createdByUsername);
        }

        int totalCards = items.stream().mapToInt(CampaignExpenseItem::getQuantity).sum();
        BigDecimal totalWholesale = items.stream().map(CampaignExpenseItem::getSubtotalWholesaleCost).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalFace = items.stream().map(CampaignExpenseItem::getSubtotalFaceValue).reduce(BigDecimal.ZERO, BigDecimal::add);

        savedExpense.setTotalCardsCount(totalCards);
        savedExpense.setTotalWholesaleCost(totalWholesale);
        savedExpense.setTotalFaceValue(totalFace);
        savedExpense.setCostVarianceAmount(totalFace.subtract(totalWholesale));
        savedExpense.setItems(items);

        savedExpense = campaignExpenseRepository.save(savedExpense);
        return mapToResponse(savedExpense);
    }

    @Transactional
    public CampaignExpenseDto.CampaignExpenseResponse addCardExpensesToCampaign(
            Long campaignId, CampaignExpenseDto.AddExpenseItemsRequest request, String addedByUsername) {

        CampaignExpense expense = campaignExpenseRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign expense record not found: " + campaignId));

        List<CampaignExpenseItem> newItems = processAndDisburseItems(expense, request.getItems(), addedByUsername);

        int addedCards = newItems.stream().mapToInt(CampaignExpenseItem::getQuantity).sum();
        BigDecimal addedWholesale = newItems.stream().map(CampaignExpenseItem::getSubtotalWholesaleCost).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal addedFace = newItems.stream().map(CampaignExpenseItem::getSubtotalFaceValue).reduce(BigDecimal.ZERO, BigDecimal::add);

        expense.setTotalCardsCount((expense.getTotalCardsCount() != null ? expense.getTotalCardsCount() : 0) + addedCards);
        expense.setTotalWholesaleCost((expense.getTotalWholesaleCost() != null ? expense.getTotalWholesaleCost() : BigDecimal.ZERO).add(addedWholesale));
        expense.setTotalFaceValue((expense.getTotalFaceValue() != null ? expense.getTotalFaceValue() : BigDecimal.ZERO).add(addedFace));
        expense.setCostVarianceAmount(expense.getTotalFaceValue().subtract(expense.getTotalWholesaleCost()));

        if (expense.getItems() != null) {
            expense.getItems().addAll(newItems);
        }

        expense = campaignExpenseRepository.save(expense);
        return mapToResponse(expense);
    }

    @Transactional
    public CampaignExpenseDto.CampaignExpenseResponse updateCampaignDetails(
            Long campaignId, CampaignExpenseDto.UpdateCampaignRequest request, String updatedByUsername) {

        CampaignExpense expense = campaignExpenseRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign expense record not found: " + campaignId));

        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new IllegalArgumentException("Both campaign start date and end date are required.");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Campaign end date cannot be before start date.");
        }

        expense.setCampaignName(request.getCampaignName().trim());
        expense.setStartDate(request.getStartDate());
        expense.setEndDate(request.getEndDate());

        String oldCategory = expense.getPurposeCategory();
        String newCategory = request.getPurposeCategory() != null ? request.getPurposeCategory().trim().toUpperCase() : oldCategory;
        expense.setPurposeCategory(newCategory);

        if (request.getBeneficiaryDept() != null) {
            expense.setBeneficiaryDept(request.getBeneficiaryDept().trim());
        }
        if (request.getDisbursedAt() != null) {
            expense.setDisbursedAt(request.getDisbursedAt());
        }
        if (request.getNotes() != null) {
            expense.setNotes(request.getNotes().trim());
        }

        // If category changed, update associated batch and card statuses
        if (!oldCategory.equalsIgnoreCase(newCategory)) {
            BatchStatus newBatchStatus = "INTERNAL_USE".equalsIgnoreCase(newCategory) ? BatchStatus.INTERNAL_USE : BatchStatus.CAMPAIGN;
            if (expense.getItems() != null) {
                for (CampaignExpenseItem it : expense.getItems()) {
                    if (it.getBatch() != null) {
                        it.getBatch().setStatus(newBatchStatus);
                        batchRepository.save(it.getBatch());
                    }
                }
            }
            List<RechargeCard> cards = rechargeCardRepository.findByCampaignExpenseId(campaignId);
            for (RechargeCard c : cards) {
                c.setStatus(newCategory);
            }
            rechargeCardRepository.saveAll(cards);
        }

        expense = campaignExpenseRepository.save(expense);
        return mapToResponse(expense);
    }

    private List<CampaignExpenseItem> processAndDisburseItems(
            CampaignExpense campaign,
            List<CampaignExpenseDto.CampaignExpenseItemRequest> itemRequests,
            String createdByUsername) {

        List<CampaignExpenseItem> items = new ArrayList<>();
        if (itemRequests == null || itemRequests.isEmpty()) {
            return items;
        }
        List<RechargeCard> cardsToUpdate = new ArrayList<>();
        String category = campaign.getPurposeCategory() != null ? campaign.getPurposeCategory().trim().toUpperCase() : "CAMPAIGN";

        for (CampaignExpenseDto.CampaignExpenseItemRequest itemReq : itemRequests) {
            CardDenomination denomination = denominationRepository.findById(itemReq.getDenominationId())
                    .orElseThrow(() -> new RuntimeException("Card product not found: " + itemReq.getDenominationId()));

            String startSerial = itemReq.getStartSerialNumber().trim();
            String endSerial = itemReq.getEndSerialNumber().trim();

            Matcher mStart = SERIAL_PATTERN.matcher(startSerial);
            Matcher mEnd = SERIAL_PATTERN.matcher(endSerial);

            if (!mStart.matches() || !mEnd.matches()) {
                throw new IllegalArgumentException("Invalid serial number format for " + denomination.getName() + " (" + startSerial + " ~ " + endSerial + ")");
            }

            String prefixStart = mStart.group(1);
            String prefixEnd = mEnd.group(1);
            if (!prefixStart.equals(prefixEnd)) {
                throw new IllegalArgumentException("Prefix mismatch: " + prefixStart + " vs " + prefixEnd);
            }

            long numStart = Long.parseLong(mStart.group(2));
            long numEnd = Long.parseLong(mEnd.group(2));
            if (numEnd < numStart) {
                throw new IllegalArgumentException("End serial cannot be smaller than start serial (" + startSerial + " ~ " + endSerial + ")");
            }

            int itemQty = (int) (numEnd - numStart + 1);

            // Find matching available batch
            List<CardBatch> availableBatches = batchRepository.findByDenominationIdAndStatus(denomination.getId(), BatchStatus.AVAILABLE);
            CardBatch matchingBatch = null;
            long bStartNum = 0, bEndNum = 0;
            String bPrefix = "";
            int bPadLen = 0;

            for (CardBatch b : availableBatches) {
                if (!StringUtils.hasText(b.getStartSerialNumber()) || !StringUtils.hasText(b.getEndSerialNumber())) continue;
                Matcher bM1 = SERIAL_PATTERN.matcher(b.getStartSerialNumber().trim());
                Matcher bM2 = SERIAL_PATTERN.matcher(b.getEndSerialNumber().trim());
                if (bM1.matches() && bM2.matches() && bM1.group(1).equals(bM2.group(1)) && bM1.group(1).equals(prefixStart)) {
                    long bN1 = Long.parseLong(bM1.group(2));
                    long bN2 = Long.parseLong(bM2.group(2));
                    if (numStart >= bN1 && numEnd <= bN2) {
                        matchingBatch = b;
                        bStartNum = bN1;
                        bEndNum = bN2;
                        bPrefix = bM1.group(1);
                        bPadLen = Math.max(bM1.group(2).length(), bM2.group(2).length());
                        break;
                    }
                }
            }

            if (matchingBatch == null) {
                throw new IllegalArgumentException("Serial range " + startSerial + " ~ " + endSerial + " is outside available stock lots for " + denomination.getName());
            }

            BigDecimal unitWholesale = denomination.getWholesalePrice() != null 
                    ? denomination.getWholesalePrice() 
                    : (denomination.getRetailPrice() != null ? denomination.getRetailPrice() : denomination.getFaceValue());
            BigDecimal unitFace = denomination.getRetailPrice() != null 
                    ? denomination.getRetailPrice() 
                    : denomination.getFaceValue();

            BigDecimal subtotalWholesale = unitWholesale.multiply(BigDecimal.valueOf(itemQty));
            BigDecimal subtotalFace = unitFace.multiply(BigDecimal.valueOf(itemQty));

            // Determine batch status to assign
            BatchStatus consumedStatus = "INTERNAL_USE".equalsIgnoreCase(category) ? BatchStatus.INTERNAL_USE : BatchStatus.CAMPAIGN;

            // 1. Keep selected range into matchingBatch and update status
            matchingBatch.setStartSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", numStart));
            matchingBatch.setEndSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", numEnd));
            matchingBatch.setQuantity(itemQty);
            matchingBatch.setTotalFaceValue(unitFace.multiply(BigDecimal.valueOf(itemQty)));
            matchingBatch.setStatus(consumedStatus);
            CardBatch spentBatch = batchRepository.save(matchingBatch);

            // 2. Re-create remaining available slices
            // Case A: start to middle
            if (numStart == bStartNum && numEnd < bEndNum) {
                int remQty = (int) (bEndNum - (numEnd + 1) + 1);
                CardBatch afterBatch = CardBatch.builder()
                        .batchNumber(matchingBatch.getBatchNumber())
                        .denomination(denomination)
                        .startSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", numEnd + 1))
                        .endSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", bEndNum))
                        .quantity(remQty)
                        .totalFaceValue(unitFace.multiply(BigDecimal.valueOf(remQty)))
                        .status(BatchStatus.AVAILABLE)
                        .createdBy(createdByUsername)
                        .notes(matchingBatch.getNotes())
                        .build();
                batchRepository.save(afterBatch);
            }
            // Case B: middle to end
            else if (numStart > bStartNum && numEnd == bEndNum) {
                int remQty = (int) ((numStart - 1) - bStartNum + 1);
                CardBatch beforeBatch = CardBatch.builder()
                        .batchNumber(matchingBatch.getBatchNumber())
                        .denomination(denomination)
                        .startSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", bStartNum))
                        .endSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", numStart - 1))
                        .quantity(remQty)
                        .totalFaceValue(unitFace.multiply(BigDecimal.valueOf(remQty)))
                        .status(BatchStatus.AVAILABLE)
                        .createdBy(createdByUsername)
                        .notes(matchingBatch.getNotes())
                        .build();
                batchRepository.save(beforeBatch);
            }
            // Case C: middle to middle
            else if (numStart > bStartNum && numEnd < bEndNum) {
                int remQty1 = (int) ((numStart - 1) - bStartNum + 1);
                CardBatch beforeBatch = CardBatch.builder()
                        .batchNumber(matchingBatch.getBatchNumber())
                        .denomination(denomination)
                        .startSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", bStartNum))
                        .endSerialNumber(bPrefix + String.format("%0" + bPadLen + "d", numStart - 1))
                        .quantity(remQty1)
                        .totalFaceValue(unitFace.multiply(BigDecimal.valueOf(remQty1)))
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
                        .totalFaceValue(unitFace.multiply(BigDecimal.valueOf(remQty2)))
                        .status(BatchStatus.AVAILABLE)
                        .createdBy(createdByUsername)
                        .notes(matchingBatch.getNotes())
                        .build();
                batchRepository.save(afterBatch);
            }

            // 3. Update individual recharge cards
            for (long n = numStart; n <= numEnd; n++) {
                String sNum = bPrefix + String.format("%0" + bPadLen + "d", n);
                RechargeCard card = rechargeCardRepository.findBySerialNumber(sNum).orElse(null);
                if (card == null) {
                    card = RechargeCard.builder()
                            .serialNumber(sNum)
                            .denomination(denomination)
                            .batch(spentBatch)
                            .status(category)
                            .campaignExpense(campaign)
                            .expiryDate(denomination.getAvailableUntil() != null ? denomination.getAvailableUntil() : LocalDate.now().plusYears(1))
                            .build();
                } else {
                    card.setBatch(spentBatch);
                    card.setStatus(category);
                    card.setCampaignExpense(campaign);
                }
                cardsToUpdate.add(card);
            }

            // 4. Record CampaignExpenseItem
            CampaignExpenseItem item = CampaignExpenseItem.builder()
                    .campaignExpense(campaign)
                    .denomination(denomination)
                    .batch(spentBatch)
                    .batchNumber(spentBatch.getBatchNumber())
                    .startSerialNumber(spentBatch.getStartSerialNumber())
                    .endSerialNumber(spentBatch.getEndSerialNumber())
                    .quantity(itemQty)
                    .unitWholesalePrice(unitWholesale)
                    .unitFaceValue(unitFace)
                    .subtotalWholesaleCost(subtotalWholesale)
                    .subtotalFaceValue(subtotalFace)
                    .notes(itemReq.getNotes())
                    .build();
            items.add(item);
        }

        rechargeCardRepository.saveAll(cardsToUpdate);
        return campaignExpenseItemRepository.saveAll(items);
    }

    @Transactional(readOnly = true)
    public Page<CampaignExpenseDto.CampaignExpenseResponse> getCampaignExpenses(
            String category, LocalDateTime startDate, LocalDateTime endDate, String search, Pageable pageable) {
        String cleanCategory = (category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category)) ? category.trim().toUpperCase() : null;
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;

        return campaignExpenseRepository.findCampaignExpensesFiltered(cleanCategory, startDate, endDate, cleanSearch, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public CampaignExpenseDto.CampaignExpenseResponse getCampaignExpenseById(Long id) {
        CampaignExpense expense = campaignExpenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign expense record not found: " + id));
        return mapToResponse(expense);
    }

    @Transactional(readOnly = true)
    public CampaignExpenseDto.CampaignCalculationSummaryDto getCalculationSummary(LocalDateTime startDate, LocalDateTime endDate) {
        Long totalCards = campaignExpenseRepository.sumTotalCardsBetween(startDate, endDate);
        BigDecimal totalWholesale = campaignExpenseRepository.sumTotalWholesaleCostBetween(startDate, endDate);
        BigDecimal totalFace = campaignExpenseRepository.sumTotalFaceValueBetween(startDate, endDate);

        long cardsCount = totalCards != null ? totalCards : 0L;
        BigDecimal wholesaleVal = totalWholesale != null ? totalWholesale : BigDecimal.ZERO;
        BigDecimal faceVal = totalFace != null ? totalFace : BigDecimal.ZERO;
        BigDecimal variance = faceVal.subtract(wholesaleVal);

        BigDecimal avgCost = cardsCount > 0 
                ? wholesaleVal.divide(BigDecimal.valueOf(cardsCount), 2, RoundingMode.HALF_UP) 
                : BigDecimal.ZERO;

        List<Object[]> categoryData = campaignExpenseRepository.aggregateByCategoryBetween(startDate, endDate);
        List<CampaignExpenseDto.CategoryBreakdownDto> categoryBreakdowns = new ArrayList<>();
        long totalAllCampaigns = 0;

        for (Object[] row : categoryData) {
            String cat = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            Long cards = ((Number) row[2]).longValue();
            BigDecimal catWholesale = (BigDecimal) row[3];
            BigDecimal catFace = (BigDecimal) row[4];
            totalAllCampaigns += count;

            double pct = wholesaleVal.compareTo(BigDecimal.ZERO) > 0
                    ? catWholesale.divide(wholesaleVal, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;

            categoryBreakdowns.add(CampaignExpenseDto.CategoryBreakdownDto.builder()
                    .category(cat)
                    .count(count)
                    .totalCards(cards)
                    .totalWholesaleCost(catWholesale)
                    .totalFaceValue(catFace)
                    .percentageOfTotalCost(pct)
                    .build());
        }

        List<Object[]> denomData = campaignExpenseItemRepository.aggregateByDenominationBetween(startDate, endDate);
        List<CampaignExpenseDto.DenominationBreakdownDto> denomBreakdowns = new ArrayList<>();

        for (Object[] row : denomData) {
            Long denomId = ((Number) row[0]).longValue();
            String name = (String) row[1];
            String code = (String) row[2];
            Long cards = ((Number) row[3]).longValue();
            BigDecimal dWholesale = (BigDecimal) row[4];
            BigDecimal dFace = (BigDecimal) row[5];

            denomBreakdowns.add(CampaignExpenseDto.DenominationBreakdownDto.builder()
                    .denominationId(denomId)
                    .denominationName(name)
                    .denominationCode(code)
                    .totalCards(cards)
                    .totalWholesaleCost(dWholesale)
                    .totalFaceValue(dFace)
                    .build());
        }

        return CampaignExpenseDto.CampaignCalculationSummaryDto.builder()
                .totalCampaigns(totalAllCampaigns)
                .totalCardsSpent(cardsCount)
                .totalWholesaleCost(wholesaleVal)
                .totalFaceValue(faceVal)
                .totalVariance(variance)
                .averageCostPerCard(avgCost)
                .categoryBreakdowns(categoryBreakdowns)
                .denominationBreakdowns(denomBreakdowns)
                .build();
    }

    private CampaignExpenseDto.CampaignExpenseResponse mapToResponse(CampaignExpense expense) {
        List<CampaignExpenseDto.CampaignExpenseItemDto> itemDtos = new ArrayList<>();
        List<String> rangeSummaries = new ArrayList<>();

        if (expense.getItems() != null) {
            for (CampaignExpenseItem item : expense.getItems()) {
                BigDecimal variance = item.getSubtotalFaceValue().subtract(item.getSubtotalWholesaleCost());
                itemDtos.add(CampaignExpenseDto.CampaignExpenseItemDto.builder()
                        .id(item.getId())
                        .denominationId(item.getDenomination().getId())
                        .denominationName(item.getDenomination().getName())
                        .denominationCode(item.getDenomination().getCode())
                        .batchId(item.getBatch() != null ? item.getBatch().getId() : null)
                        .batchNumber(item.getBatchNumber())
                        .startSerialNumber(item.getStartSerialNumber())
                        .endSerialNumber(item.getEndSerialNumber())
                        .quantity(item.getQuantity())
                        .unitWholesalePrice(item.getUnitWholesalePrice())
                        .unitFaceValue(item.getUnitFaceValue())
                        .subtotalWholesaleCost(item.getSubtotalWholesaleCost())
                        .subtotalFaceValue(item.getSubtotalFaceValue())
                        .subtotalVariance(variance)
                        .notes(item.getNotes())
                        .build());

                rangeSummaries.add(item.getDenomination().getName() + " (" + item.getQuantity() + " cards): " + item.getStartSerialNumber() + " ~ " + item.getEndSerialNumber());
            }
        }

        return CampaignExpenseDto.CampaignExpenseResponse.builder()
                .id(expense.getId())
                .referenceNo(expense.getReferenceNo())
                .campaignName(expense.getCampaignName())
                .purposeCategory(expense.getPurposeCategory())
                .startDate(expense.getStartDate())
                .endDate(expense.getEndDate())
                .beneficiaryDept(expense.getBeneficiaryDept())
                .totalCardsCount(expense.getTotalCardsCount())
                .totalWholesaleCost(expense.getTotalWholesaleCost())
                .totalFaceValue(expense.getTotalFaceValue())
                .costVarianceAmount(expense.getCostVarianceAmount())
                .disbursedAt(expense.getDisbursedAt())
                .disbursedBy(expense.getDisbursedBy())
                .notes(expense.getNotes())
                .serialRangesSummary(String.join(" | ", rangeSummaries))
                .items(itemDtos)
                .createdAt(expense.getCreatedAt())
                .build();
    }
}
