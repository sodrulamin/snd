package com.snd.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "campaign_expense_items", indexes = {
    @Index(name = "idx_camp_item_expense", columnList = "campaign_expense_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignExpenseItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_expense_id", nullable = false)
    private CampaignExpense campaignExpense;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "denomination_id", nullable = false)
    private CardDenomination denomination;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private CardBatch batch;

    @Column(name = "batch_number", length = 100)
    private String batchNumber;

    @Column(name = "start_serial_number", nullable = false, length = 50)
    private String startSerialNumber;

    @Column(name = "end_serial_number", nullable = false, length = 50)
    private String endSerialNumber;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_wholesale_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitWholesalePrice;

    @Column(name = "unit_face_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitFaceValue;

    @Column(name = "subtotal_wholesale_cost", nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotalWholesaleCost;

    @Column(name = "subtotal_face_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotalFaceValue;

    @Column(length = 255)
    private String notes;
}
