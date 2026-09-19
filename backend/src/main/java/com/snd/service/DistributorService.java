package com.snd.service;

import com.snd.dto.distributor.*;
import com.snd.model.DistributorTransaction;
import com.snd.model.PartnerProfile;
import com.snd.model.SalesOrder;
import com.snd.model.User;
import com.snd.repository.DistributorTransactionRepository;
import com.snd.repository.PartnerProfileRepository;
import com.snd.repository.SalesOrderRepository;
import com.snd.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DistributorService {

    private final UserRepository userRepository;
    private final PartnerProfileRepository partnerProfileRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final DistributorTransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;
    private final SMSService smsService;
    private final MailService mailService;

    public List<DistributorResponse> getAllDistributors() {
        return userRepository.findByRole("DISTRIBUTOR").stream()
                .map(this::mapToDistributorResponse)
                .collect(Collectors.toList());
    }

    public DistributorResponse getDistributorById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Distributor not found: " + id));
        return mapToDistributorResponse(user);
    }

    @Transactional
    public DistributorResponse createDistributor(DistributorRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }

        String rawPassword = request.getPassword() != null && !request.getPassword().isBlank()
                ? request.getPassword()
                : "dist123";

        PartnerProfile profile;
        if (request.getPartnerProfileId() != null) {
            profile = partnerProfileRepository.findById(request.getPartnerProfileId())
                    .orElseThrow(() -> new IllegalArgumentException("Partner profile not found: " + request.getPartnerProfileId()));
        } else {
            String compName = request.getFullName() != null && !request.getFullName().isBlank()
                    ? request.getFullName().trim()
                    : request.getUsername();
            profile = PartnerProfile.builder()
                    .companyName(compName)
                    .contactPerson(request.getContactPerson() != null && !request.getContactPerson().isBlank() ? request.getContactPerson().trim() : null)
                    .email(request.getEmail())
                    .phone(request.getPhone())
                    .address(request.getAddress())
                    .balance(BigDecimal.ZERO)
                    .creditLimit(request.getCreditLimit() != null ? request.getCreditLimit() : BigDecimal.ZERO)
                    .discountRate(request.getDiscountRate() != null ? request.getDiscountRate() : BigDecimal.ZERO)
                    .build();
            profile = partnerProfileRepository.save(profile);
        }

        String contactName = request.getContactPerson() != null && !request.getContactPerson().isBlank()
                ? request.getContactPerson().trim()
                : (request.getFullName() != null && !request.getFullName().isBlank() ? request.getFullName().trim() : request.getUsername());

        User distributor = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(rawPassword))
                .name(contactName)
                .mobile(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .role("DISTRIBUTOR")
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .partnerProfile(profile)
                .build();

        distributor = userRepository.save(distributor);

        if (StringUtils.hasText(distributor.getPhone())) {
            String message = smsService.createDistributorOnboardMessage(distributor);
            smsService.sendSms(distributor.getPhone(), message);
        }

        if (StringUtils.hasText(distributor.getEmail())) {
            mailService.sendDistributorOnboardEmail(distributor);
        }

        return mapToDistributorResponse(distributor);
    }

    @Transactional
    public DistributorResponse updateDistributor(Long id, DistributorRequest request) {
        User distributor = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Distributor not found: " + id));

        if (request.getUsername() != null && !request.getUsername().isBlank()
                && !request.getUsername().trim().equalsIgnoreCase(distributor.getUsername())) {
            String newUsername = request.getUsername().trim();
            if (userRepository.existsByUsername(newUsername)) {
                throw new IllegalArgumentException("Username '" + newUsername + "' is already in use");
            }
            distributor.setUsername(newUsername);
        }

        if (request.getStatus() != null) distributor.setStatus(request.getStatus());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            distributor.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getPhone() != null) distributor.setMobile(request.getPhone().trim());
        if (request.getEmail() != null) distributor.setEmail(request.getEmail().trim());
        if (request.getAddress() != null) distributor.setAddress(request.getAddress().trim());

        if (request.getPartnerProfileId() != null) {
            PartnerProfile targetProfile = partnerProfileRepository.findById(request.getPartnerProfileId())
                    .orElseThrow(() -> new IllegalArgumentException("Partner profile not found: " + request.getPartnerProfileId()));
            distributor.setPartnerProfile(targetProfile);
        }

        PartnerProfile profile = distributor.getPartnerProfile();
        if (profile == null) {
            String initialCompName = request.getFullName() != null && !request.getFullName().isBlank()
                    ? request.getFullName().trim()
                    : distributor.getUsername();
            profile = PartnerProfile.builder()
                    .companyName(initialCompName)
                    .build();
            profile = partnerProfileRepository.save(profile);
            distributor.setPartnerProfile(profile);
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            profile.setCompanyName(request.getFullName().trim());
        }
        if (request.getContactPerson() != null && !request.getContactPerson().isBlank()) {
            profile.setContactPerson(request.getContactPerson().trim());
            distributor.setName(request.getContactPerson().trim());
        } else if (distributor.getName() == null || distributor.getName().isBlank()) {
            if (request.getFullName() != null && !request.getFullName().isBlank()) {
                distributor.setName(request.getFullName().trim());
            }
        }
        if (request.getEmail() != null) profile.setEmail(request.getEmail().trim());
        if (request.getPhone() != null) profile.setPhone(request.getPhone().trim());
        if (request.getAddress() != null) profile.setAddress(request.getAddress().trim());
        if (request.getCreditLimit() != null) profile.setCreditLimit(request.getCreditLimit());
        if (request.getDiscountRate() != null) profile.setDiscountRate(request.getDiscountRate());
        partnerProfileRepository.save(profile);

        distributor = userRepository.save(distributor);
        return mapToDistributorResponse(distributor);
    }

    @Transactional
    public TransactionDto processWalletAdjustment(WalletTopUpRequest request) {
        User distributor = userRepository.findById(request.getDistributorId())
                .orElseThrow(() -> new RuntimeException("Distributor not found: " + request.getDistributorId()));

        PartnerProfile profile = distributor.getPartnerProfile();
        if (profile == null) {
            throw new IllegalStateException("Distributor does not have a partner profile");
        }

        BigDecimal prevBalance = profile.getBalance() != null ? profile.getBalance() : BigDecimal.ZERO;
        BigDecimal newBalance;

        if ("CREDIT".equalsIgnoreCase(request.getTransactionType())) {
            newBalance = prevBalance.add(request.getAmount());
        } else {
            newBalance = prevBalance.subtract(request.getAmount());
        }

        profile.setBalance(newBalance);
        partnerProfileRepository.save(profile);

        DistributorTransaction txn = DistributorTransaction.builder()
                .distributor(distributor)
                .transactionType(request.getTransactionType().toUpperCase())
                .amount(request.getAmount())
                .previousBalance(prevBalance)
                .newBalance(newBalance)
                .referenceType(request.getReferenceType())
                .referenceId(request.getReferenceId())
                .notes(request.getNotes())
                .build();

        txn = transactionRepository.save(txn);
        return mapToTransactionDto(txn);
    }

    public Page<TransactionDto> getDistributorTransactions(Long distributorId, Pageable pageable) {
        return transactionRepository.findByDistributorIdOrderByCreatedAtDesc(distributorId, pageable)
                .map(this::mapToTransactionDto);
    }

    public Page<TransactionDto> getAllTransactions(Pageable pageable) {
        return transactionRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToTransactionDto);
    }

    @Transactional
    public DistributorResponse toggleDistributorStatus(Long id) {
        User distributor = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Distributor not found: " + id));

        String newStatus = "ACTIVE".equalsIgnoreCase(distributor.getStatus()) ? "DISABLED" : "ACTIVE";
        distributor.setStatus(newStatus);
        distributor = userRepository.save(distributor);

        return mapToDistributorResponse(distributor);
    }

    @Transactional
    public DistributorResponse updateDistributorStatus(Long id, String status) {
        User distributor = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Distributor not found: " + id));

        distributor.setStatus(status);
        distributor = userRepository.save(distributor);

        return mapToDistributorResponse(distributor);
    }

    @Transactional
    public void deleteDistributor(Long id) {
        User distributor = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Distributor not found: " + id));

        List<SalesOrder> orders = salesOrderRepository.findByDistributorIdOrderByCreatedAtDesc(id);
        if (!orders.isEmpty()) {
            throw new IllegalStateException("Cannot delete distributor with existing sales orders. Consider disabling instead.");
        }

        List<DistributorTransaction> txns = transactionRepository.findByDistributorIdOrderByCreatedAtDesc(id, Pageable.unpaged()).getContent();
        if (!txns.isEmpty()) {
            transactionRepository.deleteAll(txns);
        }

        PartnerProfile profileToDelete = distributor.getPartnerProfile();
        userRepository.delete(distributor);

        if (profileToDelete != null) {
            List<User> remaining = userRepository.findByPartnerProfileId(profileToDelete.getId());
            if (remaining.isEmpty()) {
                partnerProfileRepository.delete(profileToDelete);
            }
        }
    }

    private DistributorResponse mapToDistributorResponse(User u) {
        List<SalesOrder> orders = salesOrderRepository.findByDistributorIdOrderByCreatedAtDesc(u.getId());
        BigDecimal totalPurchases = orders.stream()
                .map(SalesOrder::getFinalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        PartnerProfile p = u.getPartnerProfile();
        BigDecimal balance = p != null && p.getBalance() != null ? p.getBalance() : BigDecimal.ZERO;
        BigDecimal creditLimit = p != null && p.getCreditLimit() != null ? p.getCreditLimit() : BigDecimal.ZERO;
        BigDecimal availableCredit = balance.add(creditLimit);
        BigDecimal discountRate = p != null && p.getDiscountRate() != null ? p.getDiscountRate() : BigDecimal.ZERO;

        String companyName = (p != null && p.getCompanyName() != null && !p.getCompanyName().isBlank())
                ? p.getCompanyName()
                : (u.getName() != null && !u.getName().isBlank() ? u.getName() : u.getUsername());
        String fullName = companyName;

        String contactPerson = (p != null && p.getContactPerson() != null && !p.getContactPerson().isBlank())
                ? p.getContactPerson()
                : (u.getName() != null && !u.getName().isBlank() && !u.getName().equalsIgnoreCase(companyName) ? u.getName() : null);

        String email = (p != null && p.getEmail() != null && !p.getEmail().isBlank())
                ? p.getEmail()
                : (u.getEmail() != null && !u.getEmail().isBlank() ? u.getEmail() : null);

        String phone = (p != null && p.getPhone() != null && !p.getPhone().isBlank())
                ? p.getPhone()
                : (u.getMobile() != null && !u.getMobile().isBlank() ? u.getMobile() : null);

        String address = (p != null && p.getAddress() != null && !p.getAddress().isBlank())
                ? p.getAddress()
                : (u.getAddress() != null && !u.getAddress().isBlank() ? u.getAddress() : null);

        return DistributorResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .partnerProfileId(p != null ? p.getId() : null)
                .name(u.getName())
                .companyName(companyName)
                .mobile(u.getMobile())
                .fullName(fullName)
                .contactPerson(contactPerson)
                .email(email)
                .phone(phone)
                .status(u.getStatus())
                .balance(balance)
                .creditLimit(creditLimit)
                .availableCredit(availableCredit)
                .discountRate(discountRate)
                .address(address)
                .totalOrdersCount((long) orders.size())
                .totalPurchasesAmount(totalPurchases)
                .createdAt(u.getCreatedAt())
                .build();
    }

    private TransactionDto mapToTransactionDto(DistributorTransaction t) {
        String distName = (t.getDistributor() != null && t.getDistributor().getPartnerProfile() != null)
                ? t.getDistributor().getPartnerProfile().getCompanyName()
                : (t.getDistributor() != null ? t.getDistributor().getUsername() : "N/A");

        return TransactionDto.builder()
                .id(t.getId())
                .distributorId(t.getDistributor().getId())
                .distributorName(distName)
                .transactionType(t.getTransactionType())
                .amount(t.getAmount())
                .previousBalance(t.getPreviousBalance())
                .newBalance(t.getNewBalance())
                .referenceType(t.getReferenceType())
                .referenceId(t.getReferenceId())
                .notes(t.getNotes())
                .createdAt(t.getCreatedAt())
                .build();
    }
}