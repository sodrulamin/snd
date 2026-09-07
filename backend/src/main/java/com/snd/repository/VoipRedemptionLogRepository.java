package com.snd.repository;

import com.snd.model.VoipRedemptionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VoipRedemptionLogRepository extends JpaRepository<VoipRedemptionLog, Long> {
    List<VoipRedemptionLog> findBySerialNumberOrderByRedeemedAtDesc(String serialNumber);
    Page<VoipRedemptionLog> findAllByOrderByRedeemedAtDesc(Pageable pageable);
}