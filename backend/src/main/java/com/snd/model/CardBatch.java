package com.snd.model;

import com.snd.enums.BatchStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "card_batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardBatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_number", nullable = false, length = 100)
    private String batchNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "denomination_id", nullable = false)
    private CardDenomination denomination;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "start_serial_number", length = 50)
    private String startSerialNumber;

    @Column(name = "end_serial_number", length = 50)
    private String endSerialNumber;

    @Column(name = "total_face_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalFaceValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private BatchStatus status; // AVAILABLE, PARTIALLY_SOLD, SOLD, EXHAUSTED, EXPIRED, CANCELLED, VOID

    @CreationTimestamp
    @Column(name = "generated_at", updatable = false)
    private LocalDateTime generatedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by", length = 100)
    private String createdBy;
}
