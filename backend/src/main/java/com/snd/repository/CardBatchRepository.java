package com.snd.repository;

import com.snd.enums.BatchStatus;
import com.snd.model.CardBatch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("""
        SELECT cb FROM CardBatch cb 
        WHERE (:status IS NULL OR cb.status = :status)
          AND (:denominationId IS NULL OR cb.denomination.id = :denominationId)
          AND (:search IS NULL OR :search = '' OR 
               LOWER(cb.batchNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(cb.startSerialNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(cb.endSerialNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(cb.denomination.name) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(cb.denomination.code) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY cb.generatedAt DESC
    """)
    Page<CardBatch> findBatchesFiltered(
        @Param("status") BatchStatus status,
        @Param("denominationId") Long denominationId,
        @Param("search") String search,
        Pageable pageable
    );

    @Query("""
        SELECT cb FROM CardBatch cb 
        WHERE (:status IS NULL OR cb.status = :status)
          AND (:denominationId IS NULL OR cb.denomination.id = :denominationId)
          AND (:search IS NULL OR :search = '' OR 
               LOWER(cb.batchNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(cb.startSerialNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(cb.endSerialNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(cb.denomination.name) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(cb.denomination.code) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY cb.generatedAt DESC
    """)
    List<CardBatch> findBatchesFilteredList(
        @Param("status") BatchStatus status,
        @Param("denominationId") Long denominationId,
        @Param("search") String search
    );
}
