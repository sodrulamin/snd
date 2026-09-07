package com.snd.service;

import com.snd.dto.DistributorDto;
import com.snd.model.DistributorTransaction;
import com.snd.model.SalesOrder;
import com.snd.model.User;
import com.snd.repository.DistributorTransactionRepository;
import com.snd.repository.SalesOrderRepository;
import com.snd.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DistributorService {

    private final UserRepository userRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final DistributorTransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;

    public List<DistributorDto.DistributorResponse> getAllDistributors() {
        return userRepository.findByRole("DISTRIBUTOR").stream()
                .map(this::mapToDistributorResponse)
                .collect(Collectors.toList());
    }

    public DistributorDto.DistributorResponse getDistributorById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Distributor not found: " + id));
        return mapToDistributorResponse(user);
    }

    @Transactional
    public DistributorDto.DistributorResponse createDistributor(DistributorDto.DistributorRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }

        String rawPassword = request.getPassword() != null && !request.getPassword().isBlank()
                ? request.getPassword()
                : "dist123";

        User distributor = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(rawPassword))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .role("DISTRIBUTOR")
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .balance(BigDecimal.ZERO)
                .creditLimit(request.getCreditLimit() != null ? request.getCreditLimit() : BigDecimal.ZERO)
                .discountRate(request.getDiscountRate() != null ? request.getDiscountRate() : BigDecimal.ZERO)
                .address(request.getAddress())
                .build();

        distributor = userRepository.save(distributor);
        return mapToDistributorResponse(distributor);
    }

    @Transactional
    public DistributorDto.DistributorResponse updateDistributor(Long id, DistributorDto.DistributorRequest request) {
        User distributor = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Distributor not found: " + id));

        distributor.setFullName(request.getFullName());
        distributor.setEmail(request.getEmail());
        distributor.setPhone(request.getPhone());
        if (request.getCreditLimit() != null) distributor.setCreditLimit(request.getCreditLimit());
        if (request.getDiscountRate() != null) distributor.setDiscountRate(request.getDiscountRate());
        if (request.getAddress() != null) distributor.setAddress(request.getAddress());
        if (request.getStatus() != null) distributor.setStatus(request.getStatus());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            distributor.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        distributor = userRepository.save(distributor);
        return mapToDistributorResponse(distributor);
    }

    @Transactional
    public DistributorDto.TransactionDto processWalletAdjustment(DistributorDto.WalletTopUpRequest request) {
        User distributor = userRepository.findById(request.getDistributorId())
                .orElseThrow(() -> new RuntimeException("Distributor not found: " + request.getDistributorId()));

        BigDecimal prevBalance = distributor.getBalance();
        BigDecimal newBalance;

        if ("CREDIT".equalsIgnoreCase(request.getTransactionType())) {
            newBalance = prevBalance.add(request.getAmount());
        } else {
            newBalance = prevBalance.subtract(request.getAmount());
        }

        distributor.setBalance(newBalance);
        userRepository.save(distributor);

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

    public Page<DistributorDto.TransactionDto> getDistributorTransactions(Long distributorId, Pageable pageable) {
        return transactionRepository.findByDistributorIdOrderByCreatedAtDesc(distributorId, pageable)
                .map(this::mapToTransactionDto);
    }

    public Page<DistributorDto.TransactionDto> getAllTransactions(Pageable pageable) {
        return transactionRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToTransactionDto);
    }

    private DistributorDto.DistributorResponse mapToDistributorResponse(User u) {
        List<SalesOrder> orders = salesOrderRepository.findByDistributorIdOrderByCreatedAtDesc(u.getId());
        BigDecimal totalPurchases = orders.stream()
                .map(SalesOrder::getFinalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal availableCredit = u.getBalance().add(u.getCreditLimit());

        return DistributorDto.DistributorResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .status(u.getStatus())
                .balance(u.getBalance())
                .creditLimit(u.getCreditLimit())
                .availableCredit(availableCredit)
                .discountRate(u.getDiscountRate())
                .address(u.getAddress())
                .totalOrdersCount((long) orders.size())
                .totalPurchasesAmount(totalPurchases)
                .createdAt(u.getCreatedAt())
                .build();
    }

    private DistributorDto.TransactionDto mapToTransactionDto(DistributorTransaction t) {
        return DistributorDto.TransactionDto.builder()
                .id(t.getId())
                .distributorId(t.getDistributor().getId())
                .distributorName(t.getDistributor().getFullName())
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