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

        User distributor = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(rawPassword))
                .role("DISTRIBUTOR")
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();

        PartnerProfile profile = PartnerProfile.builder()
                .user(distributor)
                .companyName(request.getFullName())
                .contactPerson(request.getContactPerson())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .balance(BigDecimal.ZERO)
                .creditLimit(request.getCreditLimit() != null ? request.getCreditLimit() : BigDecimal.ZERO)
                .discountRate(request.getDiscountRate() != null ? request.getDiscountRate() : BigDecimal.ZERO)
                .build();

        distributor.setPartnerProfile(profile);
        distributor = userRepository.save(distributor);

        if (StringUtils.hasText(profile.getPhone())) {
            String message = smsService.createDistributorOnboardMessage(distributor);
            smsService.sendSms(profile.getPhone(), message);
        }

        if (StringUtils.hasText(profile.getEmail())) {
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

        PartnerProfile profile = distributor.getPartnerProfile();
        if (profile == null) {
            profile = PartnerProfile.builder().user(distributor).build();
            distributor.setPartnerProfile(profile);
        }

        if (request.getFullName() != null) profile.setCompanyName(request.getFullName().trim());
        if (request.getContactPerson() != null) profile.setContactPerson(request.getContactPerson().trim());
        if (request.getEmail() != null) profile.setEmail(request.getEmail().trim());
        if (request.getPhone() != null) profile.setPhone(request.getPhone().trim());
        if (request.getAddress() != null) profile.setAddress(request.getAddress().trim());
        if (request.getCreditLimit() != null) profile.setCreditLimit(request.getCreditLimit());
        if (request.getDiscountRate() != null) profile.setDiscountRate(request.getDiscountRate());

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
                .referenceType(request.getReferenceType() != null ? request.getReferenceType() : "MANUAL_ADJUSTMENT")
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

        if (!"DISTRIBUTOR".equalsIgnoreCase(distributor.getRole())) {
            throw new IllegalArgumentException("User is not a distributor");
        }

        String newStatus = "ACTIVE".equalsIgnoreCase(distributor.getStatus()) ? "INACTIVE" : "ACTIVE";
        distributor.setStatus(newStatus);
        distributor = userRepository.save(distributor);
        return mapToDistributorResponse(distributor);
    }

    @Transactional
    public DistributorResponse updateDistributorStatus(Long id, String status) {
        User distributor = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Distributor not found: " + id));

        if (!"DISTRIBUTOR".equalsIgnoreCase(distributor.getRole())) {
            throw new IllegalArgumentException("User is not a distributor");
        }

        distributor.setStatus(status != null ? status.toUpperCase() : "ACTIVE");
        distributor = userRepository.save(distributor);
        return mapToDistributorResponse(distributor);
    }

    @Transactional
    public void deleteDistributor(Long id) {
        User distributor = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Distributor not found: " + id));

        if (!"DISTRIBUTOR".equalsIgnoreCase(distributor.getRole())) {
            throw new IllegalArgumentException("User is not a distributor");
        }

        String distName = distributor.getPartnerProfile() != null ? distributor.getPartnerProfile().getCompanyName() : distributor.getUsername();
        List<SalesOrder> orders = salesOrderRepository.findByDistributorIdOrderByCreatedAtDesc(id);
        if (!orders.isEmpty()) {
            throw new IllegalStateException("Cannot delete distributor '" + distName + "' because they have " + orders.size() + " recorded sales order(s). You can change their status to INACTIVE or SUSPENDED instead.");
        }

        List<DistributorTransaction> txns = transactionRepository.findByDistributorIdOrderByCreatedAtDesc(id);
        if (!txns.isEmpty()) {
            transactionRepository.deleteAll(txns);
        }

        userRepository.delete(distributor);
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
        String fullName = p != null ? p.getCompanyName() : u.getUsername();
        String contactPerson = p != null ? p.getContactPerson() : null;
        String email = p != null ? p.getEmail() : null;
        String phone = p != null ? p.getPhone() : null;
        String address = p != null ? p.getAddress() : null;

        return DistributorResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
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