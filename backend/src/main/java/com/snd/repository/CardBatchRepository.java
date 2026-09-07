package com.snd.repository;

import com.snd.model.CardBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CardBatchRepository extends JpaRepository<CardBatch, Long> {
    Optional<CardBatch> findByBatchNumber(String batchNumber);
    List<CardBatch> findByDenominationId(Long denominationId);
    List<CardBatch> findByDenominationIdAndStatus(Long denominationId, String status);
    long countByDenominationId(Long denominationId);
    long countByDenominationIdAndStatus(Long denominationId, String status);
    List<CardBatch> findByStatus(String status);
    List<CardBatch> findByStatusOrderByGeneratedAtDesc(String status);
    List<CardBatch> findAllByOrderByGeneratedAtDesc();
}
