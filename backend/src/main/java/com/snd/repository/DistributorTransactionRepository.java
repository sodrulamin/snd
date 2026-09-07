package com.snd.repository;

import com.snd.model.DistributorTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DistributorTransactionRepository extends JpaRepository<DistributorTransaction, Long> {
    List<DistributorTransaction> findByDistributorIdOrderByCreatedAtDesc(Long distributorId);
    Page<DistributorTransaction> findByDistributorIdOrderByCreatedAtDesc(Long distributorId, Pageable pageable);
    Page<DistributorTransaction> findAllByOrderByCreatedAtDesc(Pageable pageable);
}