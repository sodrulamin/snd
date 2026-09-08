package com.snd.repository;

import com.snd.enums.BatchStatus;
import com.snd.model.CardBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CardBatchRepository extends JpaRepository<CardBatch, Long> {
    Optional<CardBatch> findByBatchNumber(String batchNumber);

    List<CardBatch> findByDenominationId(Long denominationId);

    List<CardBatch> findByDenominationIdAndStatus(Long denominationId, BatchStatus status);

    long countByDenominationId(Long denominationId);

    @Query("""
            select coalesce(sum(cb.quantity), 0) from CardBatch cb where cb.status = :status
        """)
    long countCardByStatus(BatchStatus status);

    @Query("""
            select count(distinct cb.batchNumber) from CardBatch cb where cb.status = :status
        """)
    long countDistinctBatch(BatchStatus status);

    long countByDenominationIdAndStatus(Long denominationId, BatchStatus status);

    List<CardBatch> findByStatus(BatchStatus status);

    List<CardBatch> findByStatusOrderByGeneratedAtDesc(BatchStatus status);

    List<CardBatch> findAllByOrderByGeneratedAtDesc();
}
