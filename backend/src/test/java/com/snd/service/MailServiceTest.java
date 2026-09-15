package com.snd.service;

import com.snd.dto.MailAttachment;
import com.snd.model.User;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MailService Unit Tests")
class MailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private SpringTemplateEngine templateEngine;

    @InjectMocks
    private MailService mailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(mailService, "fromEmail", "snd@ainext.site");
        ReflectionTestUtils.setField(mailService, "fromName", "IPTSP Recharge Distribution");
        ReflectionTestUtils.setField(mailService, "portalUrl", "https://snd.ainext.site");
    }

    @Test
    @DisplayName("sendHtmlMail without attachments should send MIME message successfully")
    void sendHtmlMail_noAttachments_success() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        boolean result = mailService.sendHtmlMail("test@example.com", "Test Subject", "<p>Hello</p>");

        assertThat(result).isTrue();
        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    @DisplayName("sendHtmlMail with attachment should attach file and send")
    void sendHtmlMail_withAttachment_success() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        byte[] pdfBytes = "%PDF-1.4 test".getBytes(StandardCharsets.UTF_8);
        MailAttachment attachment = MailAttachment.of("sample.pdf", pdfBytes, "application/pdf");

        boolean result = mailService.sendHtmlMail(
                "partner@example.com",
                "Onboarding Documents",
                "<h1>Welcome</h1>",
                List.of(attachment)
        );

        assertThat(result).isTrue();
        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    @DisplayName("sendTemplateMail should process Thymeleaf template and send email")
    void sendTemplateMail_success() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        when(templateEngine.process(eq("mail/distributor-onboard"), any(Context.class)))
                .thenReturn("<html><body>Rendered HTML</body></html>");

        boolean result = mailService.sendTemplateMail(
                "distributor@example.com",
                "Welcome",
                "mail/distributor-onboard",
                Map.of("username", "dist_user")
        );

        assertThat(result).isTrue();
        verify(templateEngine, times(1)).process(eq("mail/distributor-onboard"), any(Context.class));
        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    @DisplayName("sendDistributorOnboardEmail should populate model and send onboarding email")
    void sendDistributorOnboardEmail_success() throws Exception {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        when(templateEngine.process(eq("mail/distributor-onboard"), any(Context.class)))
                .thenReturn("<html><body>Welcome Distributor</body></html>");

        User distributor = User.builder()
                .id(1L)
                .username("dist_gulshan")
                .fullName("Gulshan Telecom")
                .email("gulshan@example.com")
                .phone("+8801700000000")
                .role("DISTRIBUTOR")
                .status("ACTIVE")
                .creditLimit(BigDecimal.valueOf(50000))
                .discountRate(BigDecimal.valueOf(5.5))
                .address("Gulshan-1, Dhaka")
                .createdAt(LocalDateTime.now())
                .build();

        CompletableFuture<Boolean> future = mailService.sendDistributorOnboardEmail(distributor, "Secret123!");
        Boolean result = future.get();

        assertThat(result).isTrue();
        verify(templateEngine).process(eq("mail/distributor-onboard"), any(Context.class));
        verify(mailSender).send(mimeMessage);
    }

    @Test
    @DisplayName("sendDistributorOnboardEmail should skip sending when email is blank")
    void sendDistributorOnboardEmail_skipWhenNoEmail() throws Exception {
        User distributor = User.builder()
                .username("no_email_user")
                .fullName("No Email")
                .email("")
                .build();

        CompletableFuture<Boolean> future = mailService.sendDistributorOnboardEmail(distributor, "pass");
        Boolean result = future.get();

        assertThat(result).isFalse();
        verify(mailSender, never()).send(any(MimeMessage.class));
    }
}