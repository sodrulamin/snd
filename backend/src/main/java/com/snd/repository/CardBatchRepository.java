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
    List<CardBatch> findByBatchNumberOrderByGeneratedAtDesc(String batchNumber);

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
        SELECT DISTINCT cb.batchNumber FROM CardBatch cb 
        WHERE (:status IS NULL OR cb.status = :status)
          AND (:denominationIds IS NULL OR cb.denomination.id IN :denominationIds)
        ORDER BY cb.batchNumber ASC
    """)
    List<String> findDistinctBatchNumbersByStatusAndDenominations(
        @Param("status") BatchStatus status,
        @Param("denominationIds") List<Long> denominationIds
    );

    @Query("""
        SELECT DISTINCT cb.denomination FROM CardBatch cb 
        WHERE (:status IS NULL OR cb.status = :status)
        ORDER BY cb.denomination.name ASC
    """)
    List<com.snd.model.CardDenomination> findDistinctDenominationsByStatus(@Param("status") BatchStatus status);

    @Query("""
        SELECT cb FROM CardBatch cb 
        WHERE (:status IS NULL OR cb.status = :status)
          AND (:denominationIds IS NULL OR cb.denomination.id IN :denominationIds)
          AND (:batchNumbers IS NULL OR cb.batchNumber IN :batchNumbers)
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
        @Param("denominationIds") List<Long> denominationIds,
        @Param("batchNumbers") List<String> batchNumbers,
        @Param("search") String search,
        Pageable pageable
    );

    @Query("""
        SELECT cb FROM CardBatch cb 
        WHERE (:status IS NULL OR cb.status = :status)
          AND (:denominationIds IS NULL OR cb.denomination.id IN :denominationIds)
          AND (:batchNumbers IS NULL OR cb.batchNumber IN :batchNumbers)
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
        @Param("denominationIds") List<Long> denominationIds,
        @Param("batchNumbers") List<String> batchNumbers,
        @Param("search") String search
    );
}
