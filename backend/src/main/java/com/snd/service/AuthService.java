package com.snd.service;

import com.snd.dto.auth.*;
import com.snd.model.PartnerProfile;
import com.snd.model.User;
import com.snd.repository.PartnerProfileRepository;
import com.snd.repository.UserRepository;
import java.math.BigDecimal;
import com.snd.security.CustomUserDetails;
import com.snd.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PartnerProfileRepository partnerProfileRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();

        String jwt = tokenProvider.generateToken(authentication);

        PartnerProfile profile = user.getPartnerProfile();
        String fullName = user.getName() != null && !user.getName().isBlank()
                ? user.getName()
                : (profile != null ? profile.getFullName() : user.getUsername());
        String email = user.getEmail() != null && !user.getEmail().isBlank()
                ? user.getEmail()
                : (profile != null ? profile.getEmail() : null);

        return LoginResponse.builder()
                .token(jwt)
                .tokenType("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .name(user.getName())
                .fullName(fullName)
                .email(email)
                .mobile(user.getMobile())
                .partnerProfileId(profile != null ? profile.getId() : null)
                .role(user.getRole())
                .balance(profile != null ? profile.getBalance() : BigDecimal.ZERO)
                .creditLimit(profile != null ? profile.getCreditLimit() : BigDecimal.ZERO)
                .build();
    }

    public UserProfileDto getCurrentUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        return mapToProfileDto(user);
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password does not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public UserProfileDto updateCurrentUserProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        user.setName(request.getName().trim());
        user.setMobile(request.getMobile() != null ? request.getMobile().trim() : null);
        user.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        user.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);

        if (user.getPartnerProfile() != null) {
            PartnerProfile profile = user.getPartnerProfile();
            if (request.getName() != null && !request.getName().isBlank()) {
                profile.setContactPerson(request.getName().trim());
            }
            if (request.getMobile() != null) {
                profile.setPhone(request.getMobile().trim());
            }
            if (request.getEmail() != null) {
                profile.setEmail(request.getEmail().trim());
            }
            if (request.getAddress() != null) {
                profile.setAddress(request.getAddress().trim());
            }
            partnerProfileRepository.save(profile);
        }

        user = userRepository.save(user);
        return mapToProfileDto(user);
    }

    private UserProfileDto mapToProfileDto(User user) {
        PartnerProfile profile = user.getPartnerProfile();
        String fullName = user.getName() != null && !user.getName().isBlank()
                ? user.getName()
                : (profile != null ? profile.getFullName() : user.getUsername());
        String email = user.getEmail() != null && !user.getEmail().isBlank()
                ? user.getEmail()
                : (profile != null ? profile.getEmail() : null);
        String phone = user.getMobile() != null && !user.getMobile().isBlank()
                ? user.getMobile()
                : (profile != null ? profile.getPhone() : null);
        String address = user.getAddress() != null && !user.getAddress().isBlank()
                ? user.getAddress()
                : (profile != null ? profile.getAddress() : null);

        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .name(user.getName())
                .fullName(fullName)
                .email(email)
                .mobile(user.getMobile())
                .phone(phone)
                .partnerProfileId(profile != null ? profile.getId() : null)
                .role(user.getRole())
                .status(user.getStatus())
                .balance(profile != null ? profile.getBalance() : BigDecimal.ZERO)
                .creditLimit(profile != null ? profile.getCreditLimit() : BigDecimal.ZERO)
                .discountRate(profile != null ? profile.getDiscountRate() : BigDecimal.ZERO)
                .address(address)
                .createdAt(user.getCreatedAt())
                .build();
    }
}