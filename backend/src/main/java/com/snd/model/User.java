package com.snd.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(length = 150)
    private String name; // Full Name of the user

    @Column(length = 50)
    private String mobile; // Mobile phone number of the user

    @Column(length = 150)
    private String email; // Email of the user

    @Column(columnDefinition = "TEXT")
    private String address; // Full address of the user in String format

    @Column(nullable = false, length = 50)
    private String role; // ADMIN, DISTRIBUTOR

    @Column(nullable = false, length = 50)
    private String status; // ACTIVE, INACTIVE, SUSPENDED

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "partner_profile_id")
    private PartnerProfile partnerProfile;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Convenience accessors for backwards compatibility
    public String getFullName() {
        if (name != null && !name.isBlank()) {
            return name;
        }
        if (partnerProfile != null && partnerProfile.getCompanyName() != null && !partnerProfile.getCompanyName().isBlank()) {
            return partnerProfile.getCompanyName();
        }
        return username;
    }

    public void setFullName(String fullName) {
        this.name = fullName;
    }

    public String getPhone() {
        if (mobile != null && !mobile.isBlank()) {
            return mobile;
        }
        if (partnerProfile != null && partnerProfile.getPhone() != null) {
            return partnerProfile.getPhone();
        }
        return null;
    }

    public void setPhone(String phone) {
        this.mobile = phone;
    }
}