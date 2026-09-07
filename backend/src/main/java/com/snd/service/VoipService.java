package com.snd.service;

import com.snd.dto.VoipDto;
import com.snd.model.RechargeCard;
import com.snd.model.VoipRedemptionLog;
import com.snd.repository.RechargeCardRepository;
import com.snd.repository.VoipRedemptionLogRepository;
import com.snd.util.CryptoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VoipService {

    private final RechargeCardRepository rechargeCardRepository;
    private final VoipRedemptionLogRepository redemptionLogRepository;

    @Transactional
    public VoipDto.VoipRedeemResponse redeemCard(VoipDto.VoipRedeemRequest request, String ipAddress) {
        String lookup = request.getPin() != null ? request.getPin().trim().replace(" ", "").replace("-", "") : "";
        Optional<RechargeCard> cardOpt = Optional.empty();

        if (request.getSerialNumber() != null && !request.getSerialNumber().isBlank()) {
            cardOpt = rechargeCardRepository.findBySerialNumber(request.getSerialNumber().trim());
        }
        if (cardOpt.isEmpty() && !lookup.isBlank()) {
            cardOpt = rechargeCardRepository.findBySerialNumber(lookup);
            if (cardOpt.isEmpty()) {
                String pinHash = CryptoUtil.hashPin(lookup);
                cardOpt = rechargeCardRepository.findByPinHash(pinHash);
            }
        }

        if (cardOpt.isEmpty()) {
            logFailure(request.getSerialNumber() != null ? request.getSerialNumber() : "UNKNOWN",
                    null, request.getSubscriberNumber(), "INVALID_PIN", ipAddress);
            return VoipDto.VoipRedeemResponse.builder()
                    .success(false)
                    .message("Invalid PIN. Card does not exist.")
                    .build();
        }

        RechargeCard card = cardOpt.get();

        if (request.getSerialNumber() != null && !request.getSerialNumber().isBlank()) {
            if (!card.getSerialNumber().equalsIgnoreCase(request.getSerialNumber().trim())) {
                logFailure(card.getSerialNumber(), card.getDistributor() != null ? card.getDistributor().getId() : null,
                        request.getSubscriberNumber(), "SERIAL_MISMATCH", ipAddress);
                return VoipDto.VoipRedeemResponse.builder()
                        .success(false)
                        .message("PIN does not match the provided serial number.")
                        .build();
            }
        }

        if ("REDEEMED".equalsIgnoreCase(card.getStatus())) {
            logFailure(card.getSerialNumber(), card.getDistributor() != null ? card.getDistributor().getId() : null,
                    request.getSubscriberNumber(), "ALREADY_REDEEMED", ipAddress);
            return VoipDto.VoipRedeemResponse.builder()
                    .success(false)
                    .message("This card has already been used and redeemed.")
                    .serialNumber(card.getSerialNumber())
                    .build();
        }

        if ("VOID".equalsIgnoreCase(card.getStatus())) {
            logFailure(card.getSerialNumber(), card.getDistributor() != null ? card.getDistributor().getId() : null,
                    request.getSubscriberNumber(), "CARD_VOIDED", ipAddress);
            return VoipDto.VoipRedeemResponse.builder()
                    .success(false)
                    .message("This recharge card has been voided/cancelled.")
                    .serialNumber(card.getSerialNumber())
                    .build();
        }

        if (card.getExpiryDate().isBefore(LocalDate.now())) {
            logFailure(card.getSerialNumber(), card.getDistributor() != null ? card.getDistributor().getId() : null,
                    request.getSubscriberNumber(), "EXPIRED_CARD", ipAddress);
            return VoipDto.VoipRedeemResponse.builder()
                    .success(false)
                    .message("Card has expired on " + card.getExpiryDate())
                    .serialNumber(card.getSerialNumber())
                    .build();
        }

        card.setStatus("REDEEMED");
        card.setRedeemedAt(LocalDateTime.now());
        rechargeCardRepository.save(card);

        String txnRef = "VOIP-TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        VoipRedemptionLog log = VoipRedemptionLog.builder()
                .serialNumber(card.getSerialNumber())
                .distributorId(card.getDistributor() != null ? card.getDistributor().getId() : null)
                .subscriberVoipNumber(request.getSubscriberNumber())
                .faceValue(card.getDenomination().getFaceValue())
                .status("SUCCESS")
                .ipAddress(ipAddress)
                .build();
        redemptionLogRepository.save(log);

        return VoipDto.VoipRedeemResponse.builder()
                .success(true)
                .message("Recharge successful! " + card.getDenomination().getCurrency() + " " +
                        card.getDenomination().getFaceValue() + " credited to VoIP account " + request.getSubscriberNumber())
                .serialNumber(card.getSerialNumber())
                .faceValue(card.getDenomination().getFaceValue())
                .currency(card.getDenomination().getCurrency())
                .subscriberNumber(request.getSubscriberNumber())
                .redeemedAt(card.getRedeemedAt())
                .transactionReference(txnRef)
                .build();
    }

    public Page<VoipDto.VoipLogDto> getRedemptionLogs(Pageable pageable) {
        return redemptionLogRepository.findAllByOrderByRedeemedAtDesc(pageable).map(l -> VoipDto.VoipLogDto.builder()
                .id(l.getId())
                .serialNumber(l.getSerialNumber())
                .distributorId(l.getDistributorId())
                .subscriberVoipNumber(l.getSubscriberVoipNumber())
                .faceValue(l.getFaceValue())
                .status(l.getStatus())
                .failureReason(l.getFailureReason())
                .ipAddress(l.getIpAddress())
                .redeemedAt(l.getRedeemedAt())
                .build());
    }

    private void logFailure(String serial, Long distId, String subscriber, String reason, String ip) {
        VoipRedemptionLog log = VoipRedemptionLog.builder()
                .serialNumber(serial)
                .distributorId(distId)
                .subscriberVoipNumber(subscriber)
                .faceValue(BigDecimal.ZERO)
                .status("FAILED")
                .failureReason(reason)
                .ipAddress(ip)
                .build();
        redemptionLogRepository.save(log);
    }
}