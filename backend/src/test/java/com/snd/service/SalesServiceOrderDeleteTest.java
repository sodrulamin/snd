package com.snd.service;

import com.snd.enums.BatchStatus;
import com.snd.model.*;
import com.snd.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SalesService - Delete Order and Merge Inventory Tests")
class SalesServiceOrderDeleteTest {

    @Mock
    private SalesOrderRepository orderRepository;
    @Mock
    private SalesOrderItemRepository orderItemRepository;
    @Mock
    private RechargeCardRepository rechargeCardRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PartnerProfileRepository partnerProfileRepository;
    @Mock
    private CardDenominationRepository denominationRepository;
    @Mock
    private CardBatchRepository batchRepository;
    @Mock
    private DistributorTransactionRepository transactionRepository;
    @Mock
    private CampaignExpenseItemRepository campaignExpenseItemRepository;
    @Mock
    private InvoicePdfService invoicePdfService;
    @Mock
    private MailService mailService;

    @InjectMocks
    private SalesService salesService;

    private CardDenomination denomination;
    private User distributor;
    private SalesOrder order;
    private CardBatch soldBatch;
    private SalesOrderItem orderItem;

    @BeforeEach
    void setUp() {
        denomination = CardDenomination.builder()
                .id(1L)
                .name("Tk 100")
                .code("TK100")
                .faceValue(BigDecimal.valueOf(100))
                .wholesalePrice(BigDecimal.valueOf(95))
                .retailPrice(BigDecimal.valueOf(100))
                .build();

        distributor = User.builder()
                .id(10L)
                .username("dist1")
                .role("DISTRIBUTOR")
                .build();
        PartnerProfile partnerProfile = PartnerProfile.builder()
                .id(10L)
                .companyName("Distributor Rahim")
                .balance(BigDecimal.valueOf(5000))
                .build();
        distributor.setPartnerProfile(partnerProfile);

        soldBatch = CardBatch.builder()
                .id(100L)
                .batchNumber("LOT-100-20260901")
                .denomination(denomination)
                .startSerialNumber("SN-100-0001")
                .endSerialNumber("SN-100-0200")
                .quantity(200)
                .totalFaceValue(BigDecimal.valueOf(19000))
                .status(BatchStatus.SOLD)
                .build();

        orderItem = SalesOrderItem.builder()
                .id(200L)
                .denomination(denomination)
                .batch(soldBatch)
                .quantity(200)
                .unitFaceValue(BigDecimal.valueOf(95))
                .subtotalFaceValue(BigDecimal.valueOf(19000))
                .subtotalFinal(BigDecimal.valueOf(19000))
                .build();

        order = SalesOrder.builder()
                .id(50L)
                .orderNumber("ORD-20260915-001")
                .distributor(distributor)
                .paymentMethod("BALANCE_CREDIT")
                .totalCardsCount(200)
                .totalFaceValue(BigDecimal.valueOf(19000))
                .finalAmount(BigDecimal.valueOf(19000))
                .items(new ArrayList<>(List.of(orderItem)))
                .build();
    }

    @Test
    @DisplayName("deleteOrder should restore cards to IN_STOCK, refund wallet balance, and merge sequential batches")
    void deleteOrder_success_mergesSequentialInventory() {
        when(orderRepository.findById(50L)).thenReturn(Optional.of(order));

        RechargeCard card1 = RechargeCard.builder()
                .id(1L)
                .serialNumber("SN-100-0001")
                .status("SOLD")
                .order(order)
                .distributor(distributor)
                .batch(soldBatch)
                .build();
        when(rechargeCardRepository.findByOrderId(50L)).thenReturn(List.of(card1));
        when(orderItemRepository.findByOrderId(50L)).thenReturn(List.of(orderItem));
        when(denominationRepository.findById(1L)).thenReturn(Optional.of(denomination));

        // Existing available batch that is sequential with the restored batch
        // soldBatch: SN-100-0001 ~ SN-100-0200 (num 1 to 200)
        // existingBatch: SN-100-0201 ~ SN-100-0500 (num 201 to 500)
        CardBatch existingAvailableBatch = CardBatch.builder()
                .id(101L)
                .batchNumber("LOT-100-20260901")
                .denomination(denomination)
                .startSerialNumber("SN-100-0201")
                .endSerialNumber("SN-100-0500")
                .quantity(300)
                .totalFaceValue(BigDecimal.valueOf(28500))
                .status(BatchStatus.AVAILABLE)
                .build();

        // First findByDenominationIdAndStatus returns the 2 sequential batches
        // After merge, returns the single merged batch
        when(batchRepository.findByDenominationIdAndStatus(1L, BatchStatus.AVAILABLE))
                .thenReturn(new ArrayList<>(List.of(soldBatch, existingAvailableBatch)))
                .thenReturn(new ArrayList<>(List.of(soldBatch)));

        salesService.deleteOrder(50L);

        // 1. Verify distributor balance was refunded
        assertThat(distributor.getPartnerProfile().getBalance()).isEqualByComparingTo(BigDecimal.valueOf(24000)); // 5000 + 19000
        verify(partnerProfileRepository).save(distributor.getPartnerProfile());
        verify(transactionRepository).save(any(DistributorTransaction.class));

        // 2. Verify cards were marked IN_STOCK and disassociated
        assertThat(card1.getStatus()).isEqualTo("IN_STOCK");
        assertThat(card1.getOrder()).isNull();
        assertThat(card1.getDistributor()).isNull();
        verify(rechargeCardRepository).saveAll(any());

        // 3. Verify order was deleted
        verify(orderRepository).delete(order);
        verify(orderItemRepository).deleteAll(any());

        // 4. Verify sequential batches were merged
        // soldBatch (primary) merged with existingAvailableBatch (secondary)
        assertThat(soldBatch.getStartSerialNumber()).isEqualTo("SN-100-0001");
        assertThat(soldBatch.getEndSerialNumber()).isEqualTo("SN-100-0500");
        assertThat(soldBatch.getQuantity()).isEqualTo(500);
        assertThat(soldBatch.getTotalFaceValue()).isEqualByComparingTo(BigDecimal.valueOf(47500)); // 500 * 95

        verify(batchRepository).save(soldBatch);
        verify(batchRepository).delete(existingAvailableBatch);
    }

    @Test
    @DisplayName("deleteOrder should throw IllegalStateException if any card has been REDEEMED")
    void deleteOrder_fails_ifCardRedeemed() {
        when(orderRepository.findById(50L)).thenReturn(Optional.of(order));

        RechargeCard redeemedCard = RechargeCard.builder()
                .id(1L)
                .serialNumber("SN-100-0001")
                .status("REDEEMED")
                .order(order)
                .build();
        when(rechargeCardRepository.findByOrderId(50L)).thenReturn(List.of(redeemedCard));

        assertThatThrownBy(() -> salesService.deleteOrder(50L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already been redeemed");

        verify(orderRepository, never()).delete(any());
        verify(partnerProfileRepository, never()).save(any());
    }
}