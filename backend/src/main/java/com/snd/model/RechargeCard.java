package com.snd.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "recharge_cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RechargeCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private CardBatch batch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "denomination_id", nullable = false)
    private CardDenomination denomination;

    @Column(name = "serial_number", nullable = false, unique = true, length = 50)
    private String serialNumber;

    @Column(name = "pin_hash", length = 255)
    private String pinHash;

    @Column(name = "pin_encrypted", length = 255)
    private String pinEncrypted;

    @Column(name = "pin_masked", length = 50)
    private String pinMasked;

    @Column(nullable = false, length = 50)
    private String status; // IN_STOCK, ALLOCATED, SOLD, REDEEMED, VOID

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "distributor_id")
    private User distributor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private SalesOrder order;

    @Column(name = "sold_at")
    private LocalDateTime soldAt;

    @Column(name = "redeemed_at")
    private LocalDateTime redeemedAt;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}