package com.snd.repository;

import com.snd.model.PartnerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PartnerProfileRepository extends JpaRepository<PartnerProfile, Long> {
    Optional<PartnerProfile> findByUserId(Long userId);
    Optional<PartnerProfile> findByUserUsername(String username);
    boolean existsByUserId(Long userId);
}
