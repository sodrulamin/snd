package com.snd.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "campaign_expenses", indexes = {
    @Index(name = "idx_campaign_purpose", columnList = "purpose_category"),
    @Index(name = "idx_campaign_date", columnList = "disbursed_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignExpense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reference_no", nullable = false, unique = true, length = 100)
    private String referenceNo;

    @Column(name = "campaign_name", nullable = false, length = 255)
    private String campaignName;

    @Column(name = "purpose_category", nullable = false, length = 50)
    private String purposeCategory; // CAMPAIGN, INTERNAL_USE, PROMOTION, COMPLIMENTARY, TESTING, OTHER

    @Column(name = "beneficiary_dept", length = 150)
    private String beneficiaryDept;

    @Column(name = "total_cards_count", nullable = false)
    @Builder.Default
    private Integer totalCardsCount = 0;

    @Column(name = "total_wholesale_cost", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalWholesaleCost = BigDecimal.ZERO;

    @Column(name = "total_face_value", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalFaceValue = BigDecimal.ZERO;

    @Column(name = "cost_variance_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal costVarianceAmount = BigDecimal.ZERO;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "disbursed_at", nullable = false)
    private LocalDateTime disbursedAt;

    @Column(name = "disbursed_by", nullable = false, length = 100)
    private String disbursedBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "campaignExpense", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CampaignExpenseItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
