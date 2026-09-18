package com.snd.service;

import com.snd.dto.auth.*;
import com.snd.model.PartnerProfile;
import com.snd.model.User;
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
        return LoginResponse.builder()
                .token(jwt)
                .tokenType("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .fullName(profile != null ? profile.getFullName() : user.getUsername())
                .email(profile != null ? profile.getEmail() : null)
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

    private UserProfileDto mapToProfileDto(User user) {
        PartnerProfile profile = user.getPartnerProfile();
        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(profile != null ? profile.getFullName() : user.getUsername())
                .email(profile != null ? profile.getEmail() : null)
                .phone(profile != null ? profile.getPhone() : null)
                .role(user.getRole())
                .status(user.getStatus())
                .balance(profile != null ? profile.getBalance() : BigDecimal.ZERO)
                .creditLimit(profile != null ? profile.getCreditLimit() : BigDecimal.ZERO)
                .discountRate(profile != null ? profile.getDiscountRate() : BigDecimal.ZERO)
                .address(profile != null ? profile.getAddress() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}