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

    @Query("SELECT o FROM SalesOrder o WHERE " +
           "(:distributorId IS NULL OR o.distributor.id = :distributorId) AND " +
           "(:orderStatus IS NULL OR o.orderStatus = :orderStatus) AND " +
           "(:startDate IS NULL OR o.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR o.createdAt <= :endDate) " +
           "ORDER BY o.createdAt DESC")
    Page<SalesOrder> filterOrders(
            @Param("distributorId") Long distributorId,
            @Param("orderStatus") String orderStatus,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(o.finalAmount), 0) FROM SalesOrder o WHERE o.paymentStatus = 'PAID'")
    BigDecimal calculateTotalRevenue();

    @Query("SELECT COALESCE(SUM(o.totalFaceValue), 0) FROM SalesOrder o")
    BigDecimal calculateTotalFaceValueSold();

    @Query("SELECT COALESCE(SUM(o.totalCardsCount), 0) FROM SalesOrder o")
    Long calculateTotalCardsSold();
}