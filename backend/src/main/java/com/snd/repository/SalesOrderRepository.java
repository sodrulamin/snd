package com.snd.repository;

import com.snd.model.SalesOrder;
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
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {
    Optional<SalesOrder> findByOrderNumber(String orderNumber);
    List<SalesOrder> findByDistributorIdOrderByCreatedAtDesc(Long distributorId);
    Page<SalesOrder> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("""
        SELECT o FROM SalesOrder o WHERE
        (:distributorIds IS NULL OR o.distributor.id IN :distributorIds) AND
        (:orderStatus IS NULL OR :orderStatus = '' OR o.orderStatus = :orderStatus) AND
        (:paymentMethods IS NULL OR o.paymentMethod IN :paymentMethods) AND
        (:startDate IS NULL OR o.createdAt >= :startDate) AND
        (:endDate IS NULL OR o.createdAt <= :endDate) AND
        (:search IS NULL OR :search = '' OR
         LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR
         LOWER(COALESCE(o.distributor.partnerProfile.companyName, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
         LOWER(o.distributor.username) LIKE LOWER(CONCAT('%', :search, '%')) OR
         LOWER(COALESCE(o.serialRangesSummary, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
         LOWER(COALESCE(o.notes, '')) LIKE LOWER(CONCAT('%', :search, '%'))) AND
        (:denominationIds IS NULL OR EXISTS (
             SELECT 1 FROM SalesOrderItem item WHERE item.order = o AND item.denomination.id IN :denominationIds
        ))
        ORDER BY o.createdAt DESC
    """)
    Page<SalesOrder> filterOrders(
            @Param("distributorIds") List<Long> distributorIds,
            @Param("orderStatus") String orderStatus,
            @Param("paymentMethods") List<String> paymentMethods,
            @Param("denominationIds") List<Long> denominationIds,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(o.finalAmount), 0) FROM SalesOrder o WHERE o.paymentStatus = 'PAID'")
    BigDecimal calculateTotalRevenue();

    @Query("SELECT COALESCE(SUM(o.finalAmount), 0) FROM SalesOrder o WHERE o.paymentStatus = 'PAID' AND o.createdAt >= :startDate AND o.createdAt <= :endDate")
    BigDecimal calculateRevenueBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COALESCE(SUM(o.totalFaceValue), 0) FROM SalesOrder o")
    BigDecimal calculateTotalFaceValueSold();

    @Query("SELECT COALESCE(SUM(o.totalFaceValue), 0) FROM SalesOrder o WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate")
    BigDecimal calculateFaceValueSoldBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COALESCE(SUM(o.totalCardsCount), 0) FROM SalesOrder o")
    Long calculateTotalCardsSold();

    @Query("SELECT COALESCE(SUM(o.totalCardsCount), 0) FROM SalesOrder o WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate")
    Long calculateCardsSoldBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}