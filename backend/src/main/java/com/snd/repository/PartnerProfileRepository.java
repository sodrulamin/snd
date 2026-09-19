package com.snd.repository;

import com.snd.model.PartnerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PartnerProfileRepository extends JpaRepository<PartnerProfile, Long> {

    @Query("SELECT u.partnerProfile FROM User u WHERE u.id = :userId")
    Optional<PartnerProfile> findByUserId(@Param("userId") Long userId);

    @Query("SELECT u.partnerProfile FROM User u WHERE u.username = :username")
    Optional<PartnerProfile> findByUserUsername(@Param("username") String username);

    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.id = :userId AND u.partnerProfile IS NOT NULL")
    boolean existsByUserId(@Param("userId") Long userId);
}
