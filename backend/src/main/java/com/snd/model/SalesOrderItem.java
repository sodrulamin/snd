package com.snd.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "sales_order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private SalesOrder order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "denomination_id", nullable = false)
    private CardDenomination denomination;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id")
    private CardBatch batch;


    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_face_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitFaceValue;

    @Column(name = "subtotal_face_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotalFaceValue;

    @Column(name = "item_discount_percent", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal itemDiscountPercent = BigDecimal.ZERO;

    @Column(name = "subtotal_final", nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotalFinal;
}
