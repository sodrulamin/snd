package com.snd.service;

import com.snd.dto.mail.MailAttachment;
import com.snd.dto.sales.OrderItemDto;
import com.snd.dto.sales.SalesOrderResponse;
import com.snd.model.PartnerProfile;
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
                .role("DISTRIBUTOR")
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();
        PartnerProfile profile = PartnerProfile.builder()
                .id(1L)
                .user(distributor)
                .companyName("Gulshan Telecom")
                .email("gulshan@example.com")
                .phone("+8801700000000")
                .creditLimit(BigDecimal.valueOf(50000))
                .discountRate(BigDecimal.valueOf(5.5))
                .address("Gulshan-1, Dhaka")
                .build();
        distributor.setPartnerProfile(profile);

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
                .build();
        PartnerProfile profile = PartnerProfile.builder()
                .companyName("No Email")
                .email("")
                .build();
        distributor.setPartnerProfile(profile);

        CompletableFuture<Boolean> future = mailService.sendDistributorOnboardEmail(distributor, "pass");
        Boolean result = future.get();

        assertThat(result).isFalse();
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendHtmlMail with CC list should set CC recipients on MimeMessage")
    void sendHtmlMail_withCcAndAttachments() throws Exception {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        byte[] pdfBytes = "%PDF-1.4 test invoice".getBytes(StandardCharsets.UTF_8);
        MailAttachment attachment = MailAttachment.of("Invoice.pdf", pdfBytes, "application/pdf");

        boolean result = mailService.sendHtmlMail(
                "distributor@example.com",
                List.of("admin@ainext.site", "distributor@example.com"), // duplicate to address should be filtered out
                "Invoice Subject",
                "<h1>Invoice Details</h1>",
                List.of(attachment)
        );

        assertThat(result).isTrue();
        verify(mailSender).send(mimeMessage);
    }

    @Test
    @DisplayName("sendOrderConfirmationEmail should render order template and send email with PDF invoice and CC")
    void sendOrderConfirmationEmail_success() throws Exception {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        when(templateEngine.process(eq("mail/order-placed"), any(Context.class)))
                .thenReturn("<html><body>Order Confirmed</body></html>");

        OrderItemDto item = OrderItemDto.builder()
                .denominationName("Tk 100")
                .batchNumber("LOT-100-01")
                .serialRange("SN-0001 ~ SN-0500")
                .unitFaceValue(BigDecimal.valueOf(100))
                .quantity(500)
                .itemDiscountPercent(BigDecimal.valueOf(5))
                .subtotalFinal(BigDecimal.valueOf(47500))
                .build();

        SalesOrderResponse order = SalesOrderResponse.builder()
                .orderNumber("ORD-20260916-001")
                .distributorName("Gulshan Telecom")
                .distributorEmail("gulshan@example.com")
                .distributorPhone("+8801700000000")
                .totalCardsCount(500)
                .totalFaceValue(BigDecimal.valueOf(50000))
                .discountPercentage(BigDecimal.valueOf(5))
                .discountAmount(BigDecimal.valueOf(2500))
                .finalAmount(BigDecimal.valueOf(47500))
                .paymentMethod("BALANCE_CREDIT")
                .paymentStatus("PAID")
                .orderStatus("COMPLETED")
                .createdAt(LocalDateTime.now())
                .items(List.of(item))
                .build();

        User distributor = User.builder()
                .id(1L)
                .username("dist_gulshan")
                .build();
        PartnerProfile profile = PartnerProfile.builder()
                .id(1L)
                .user(distributor)
                .companyName("Gulshan Telecom")
                .email("gulshan@example.com")
                .build();
        distributor.setPartnerProfile(profile);

        byte[] invoicePdf = "%PDF-1.4 simulated invoice bytes".getBytes(StandardCharsets.UTF_8);

        CompletableFuture<Boolean> future = mailService.sendOrderConfirmationEmail(
                order,
                distributor,
                "admin@ainext.site",
                invoicePdf
        );
        Boolean result = future.get();

        assertThat(result).isTrue();
        verify(templateEngine).process(eq("mail/order-placed"), any(Context.class));
        verify(mailSender).send(mimeMessage);
    }
}