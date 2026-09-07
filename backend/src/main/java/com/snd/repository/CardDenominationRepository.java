package com.snd.repository;

import com.snd.model.CardDenomination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CardDenominationRepository extends JpaRepository<CardDenomination, Long> {
    List<CardDenomination> findByIsActiveTrue();
    Optional<CardDenomination> findByCode(String code);
    boolean existsByCode(String code);
}
