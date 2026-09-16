package com.snd.service;

import com.snd.model.PartnerProfile;
import com.snd.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("SMSService")
class SMSServiceTest {

    private SMSService smsService;

    @BeforeEach
    void setUp() {
        smsService = new SMSService();
    }

    @Test
    @DisplayName("createDistributorOnboardMessage should NOT contain newline (\\n or \\r) characters")
    void createDistributorOnboardMessage_noNewlines() {
        User user = User.builder()
                .username("dist_test")
                .createdAt(LocalDateTime.now())
                .build();

        PartnerProfile profile = PartnerProfile.builder()
                .user(user)
                .companyName("Sodrul Telecom Ltd")
                .creditLimit(BigDecimal.valueOf(25000))
                .discountRate(BigDecimal.valueOf(5.5))
                .build();
        user.setPartnerProfile(profile);

        String message = smsService.createDistributorOnboardMessage(user);
        System.out.println("message: " + message);

        assertThat(message).doesNotContain("\n");
        assertThat(message).doesNotContain("\r");
        assertThat(message).contains("Welcome to IPTSP Sales and Distribution, Sodrul Telecom Ltd!");
        assertThat(message).contains("Username: dist_test");
//        assertThat(message).contains("Credit Limit: BDT 25,000.00.");
//        assertThat(message).contains("Discount Rate: 5.5%.");
//        assertThat(message).contains("Support: 8809643901704.");
    }
}
