package com.snd.config;

import com.snd.model.RechargeCard;
import com.snd.model.User;
import com.snd.repository.RechargeCardRepository;
import com.snd.repository.UserRepository;
import com.snd.util.CryptoUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RechargeCardRepository rechargeCardRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Checking initial system credentials and seed cards...");
        
        Optional<User> adminOpt = userRepository.findByUsername("admin");
        if (adminOpt.isPresent()) {
            User admin = adminOpt.get();
            admin.setPassword(passwordEncoder.encode("admin123"));
            userRepository.save(admin);
            log.info("Admin credentials initialized successfully: admin / admin123");
        }

        Optional<User> distOpt = userRepository.findByUsername("dist_metro");
        if (distOpt.isPresent()) {
            User dist = distOpt.get();
            dist.setPassword(passwordEncoder.encode("dist123"));
            userRepository.save(dist);
            log.info("Distributor credentials initialized successfully: dist_metro / dist123");
        }

        Optional<User> apexOpt = userRepository.findByUsername("dist_apex");
        if (apexOpt.isPresent()) {
            User dist = apexOpt.get();
            dist.setPassword(passwordEncoder.encode("dist123"));
            userRepository.save(dist);
        }

        // Initialize any seed cards that have dummy PINs with valid AES encrypted PINs & SHA hashes
        List<RechargeCard> seedCards = rechargeCardRepository.findAll();
        for (RechargeCard card : seedCards) {
            if (card.getPinEncrypted() == null || card.getPinEncrypted().startsWith("ENC_") || CryptoUtil.decryptPin(card.getPinEncrypted()).equals("******")) {
                String pin = CryptoUtil.generateNumericPin(12);
                card.setPinHash(CryptoUtil.hashPin(pin));
                card.setPinEncrypted(CryptoUtil.encryptPin(pin));
                card.setPinMasked(CryptoUtil.maskPin(pin));
                rechargeCardRepository.save(card);
            }
        }
        log.info("Recharge card security hashes verified.");
    }
}