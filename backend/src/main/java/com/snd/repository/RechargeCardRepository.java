package com.snd.repository;

import com.snd.model.RechargeCard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RechargeCardRepository extends JpaRepository<RechargeCard, Long> {
    Optional<RechargeCard> findBySerialNumber(String serialNumber);
    boolean existsBySerialNumber(String serialNumber);
    Optional<RechargeCard> findByPinHash(String pinHash);
    
    long countByStatus(String status);
    long countByDenominationIdAndStatus(Long denominationId, String status);
    long countByBatchIdAndStatus(Long batchId, String status);

    @Query("SELECT c FROM RechargeCard c WHERE c.denomination.id = :denominationId AND c.status = 'IN_STOCK' ORDER BY c.batch.id ASC, c.id ASC")
    List<RechargeCard> findAvailableCardsByDenomination(@Param("denominationId") Long denominationId, Pageable pageable);

    @Query("SELECT c FROM RechargeCard c WHERE c.batch.id = :batchId AND c.status = 'IN_STOCK' ORDER BY c.id ASC")
    List<RechargeCard> findAvailableCardsByBatch(@Param("batchId") Long batchId, Pageable pageable);

    @Query("SELECT c FROM RechargeCard c WHERE " +
           "(:batchId IS NULL OR c.batch.id = :batchId) AND " +
           "(:denominationId IS NULL OR c.denomination.id = :denominationId) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:distributorId IS NULL OR c.distributor.id = :distributorId) AND " +
           "(:serialNumber IS NULL OR c.serialNumber LIKE %:serialNumber%) ORDER BY c.id ASC")
    Page<RechargeCard> searchCards(
            @Param("batchId") Long batchId,
            @Param("denominationId") Long denominationId,
            @Param("status") String status,
            @Param("distributorId") Long distributorId,
            @Param("serialNumber") String serialNumber,
            Pageable pageable
    );

    List<RechargeCard> findByOrderId(Long orderId);
    List<RechargeCard> findByBatchId(Long batchId);
    List<RechargeCard> findByCampaignExpenseId(Long campaignExpenseId);
}
