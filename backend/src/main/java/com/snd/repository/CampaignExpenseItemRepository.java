package com.snd.repository;

import com.snd.model.CampaignExpenseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CampaignExpenseItemRepository extends JpaRepository<CampaignExpenseItem, Long> {

    List<CampaignExpenseItem> findByCampaignExpenseId(Long campaignExpenseId);

    @Query("SELECT i.denomination.id, i.denomination.name, i.denomination.code, " +
           "COALESCE(SUM(i.quantity), 0), COALESCE(SUM(i.subtotalWholesaleCost), 0), COALESCE(SUM(i.subtotalFaceValue), 0) " +
           "FROM CampaignExpenseItem i WHERE " +
           "(:startDate IS NULL OR i.campaignExpense.disbursedAt >= :startDate) AND " +
           "(:endDate IS NULL OR i.campaignExpense.disbursedAt <= :endDate) " +
           "GROUP BY i.denomination.id, i.denomination.name, i.denomination.code")
    List<Object[]> aggregateByDenominationBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
