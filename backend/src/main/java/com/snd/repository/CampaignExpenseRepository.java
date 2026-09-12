package com.snd.repository;

import com.snd.model.CampaignExpense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignExpenseRepository extends JpaRepository<CampaignExpense, Long> {

    Optional<CampaignExpense> findByReferenceNo(String referenceNo);

    boolean existsByReferenceNo(String referenceNo);

    @Query("SELECT c FROM CampaignExpense c WHERE " +
           "(:category IS NULL OR c.purposeCategory = :category) AND " +
           "(:startDate IS NULL OR c.disbursedAt >= :startDate) AND " +
           "(:endDate IS NULL OR c.disbursedAt <= :endDate) AND " +
           "(:search IS NULL OR LOWER(c.campaignName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "  OR LOWER(c.referenceNo) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "  OR LOWER(c.beneficiaryDept) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY c.disbursedAt DESC")
    Page<CampaignExpense> findCampaignExpensesFiltered(
            @Param("category") String category,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT c FROM CampaignExpense c WHERE " +
           "(:category IS NULL OR c.purposeCategory = :category) AND " +
           "(:startDate IS NULL OR c.disbursedAt >= :startDate) AND " +
           "(:endDate IS NULL OR c.disbursedAt <= :endDate) AND " +
           "(:search IS NULL OR LOWER(c.campaignName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "  OR LOWER(c.referenceNo) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "  OR LOWER(c.beneficiaryDept) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY c.disbursedAt DESC")
    List<CampaignExpense> findAllCampaignExpensesFiltered(
            @Param("category") String category,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("search") String search);

    @Query("SELECT COALESCE(SUM(c.totalCardsCount), 0) FROM CampaignExpense c WHERE " +
           "(:startDate IS NULL OR c.disbursedAt >= :startDate) AND " +
           "(:endDate IS NULL OR c.disbursedAt <= :endDate)")
    Long sumTotalCardsBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COALESCE(SUM(c.totalWholesaleCost), 0) FROM CampaignExpense c WHERE " +
           "(:startDate IS NULL OR c.disbursedAt >= :startDate) AND " +
           "(:endDate IS NULL OR c.disbursedAt <= :endDate)")
    BigDecimal sumTotalWholesaleCostBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COALESCE(SUM(c.totalFaceValue), 0) FROM CampaignExpense c WHERE " +
           "(:startDate IS NULL OR c.disbursedAt >= :startDate) AND " +
           "(:endDate IS NULL OR c.disbursedAt <= :endDate)")
    BigDecimal sumTotalFaceValueBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT c.purposeCategory, COUNT(c), COALESCE(SUM(c.totalCardsCount), 0), COALESCE(SUM(c.totalWholesaleCost), 0), COALESCE(SUM(c.totalFaceValue), 0) " +
           "FROM CampaignExpense c WHERE " +
           "(:startDate IS NULL OR c.disbursedAt >= :startDate) AND " +
           "(:endDate IS NULL OR c.disbursedAt <= :endDate) " +
           "GROUP BY c.purposeCategory")
    List<Object[]> aggregateByCategoryBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
