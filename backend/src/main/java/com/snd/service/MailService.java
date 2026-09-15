package com.snd.service;

import com.snd.dto.MailAttachment;
import com.snd.model.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Service for dispatching HTML emails with optional attachments and Thymeleaf templates.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    @Value("${app.mail.from:${spring.mail.username:snd@ainext.site}}")
    private String fromEmail;

    @Value("${app.mail.from-name:IPTSP Recharge Distribution}")
    private String fromName;

    @Value("${app.portal.url:https://snd.ainext.site}")
    private String portalUrl;

    /**
     * Sends an HTML email with optional attachments synchronously.
     *
     * @param to          recipient email address
     * @param subject     subject line
     * @param htmlContent HTML body
     * @param attachments optional list of attachments (can be null or empty)
     * @return true if sent successfully, false otherwise
     */
    public boolean sendHtmlMail(String to, String subject, String htmlContent, List<MailAttachment> attachments) {
        if (!StringUtils.hasText(to)) {
            log.warn("Cannot send email: recipient address is empty.");
            return false;
        }

        try {
            boolean hasAttachments = attachments != null && !attachments.isEmpty();
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, hasAttachments, StandardCharsets.UTF_8.name());

            try {
                helper.setFrom(fromEmail, fromName);
            } catch (UnsupportedEncodingException e) {
                helper.setFrom(fromEmail);
            }

            helper.setTo(to.trim());
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            if (hasAttachments) {
                for (MailAttachment attachment : attachments) {
                    if (attachment != null && StringUtils.hasText(attachment.getFilename()) && attachment.getSource() != null) {
                        if (StringUtils.hasText(attachment.getContentType())) {
                            helper.addAttachment(attachment.getFilename(), attachment.getSource(), attachment.getContentType());
                        } else {
                            helper.addAttachment(attachment.getFilename(), attachment.getSource());
                        }
                    }
                }
            }

            mailSender.send(message);
            log.info("Email successfully sent to '{}' with subject '{}'", to, subject);
            return true;

        } catch (MessagingException e) {
            log.error("MessagingException while sending email to '{}': {}", to, e.getMessage(), e);
            return false;
        } catch (Exception e) {
            log.error("Unexpected error while sending email to '{}': {}", to, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Sends an HTML email with no attachments.
     */
    public boolean sendHtmlMail(String to, String subject, String htmlContent) {
        return sendHtmlMail(to, subject, htmlContent, Collections.emptyList());
    }

    /**
     * Renders a Thymeleaf HTML template and sends the resulting email synchronously.
     *
     * @param to           recipient email address
     * @param subject      subject line
     * @param templatePath template path relative to templates directory (e.g. "mail/distributor-onboard")
     * @param variables    model variables passed to Thymeleaf template
     * @param attachments  optional list of attachments
     * @return true if sent successfully, false otherwise
     */
    public boolean sendTemplateMail(String to, String subject, String templatePath, Map<String, Object> variables, List<MailAttachment> attachments) {
        try {
            Context context = new Context();
            if (variables != null) {
                context.setVariables(variables);
            }
            String htmlContent = templateEngine.process(templatePath, context);
            return sendHtmlMail(to, subject, htmlContent, attachments);
        } catch (Exception e) {
            log.error("Failed to process Thymeleaf template '{}' for recipient '{}': {}", templatePath, to, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Renders a Thymeleaf HTML template and sends the resulting email without attachments.
     */
    public boolean sendTemplateMail(String to, String subject, String templatePath, Map<String, Object> variables) {
        return sendTemplateMail(to, subject, templatePath, variables, Collections.emptyList());
    }

    /**
     * Sends a template email asynchronously using the dedicated mail thread pool.
     */
    @Async("mailExecutor")
    public CompletableFuture<Boolean> sendTemplateMailAsync(String to, String subject, String templatePath, Map<String, Object> variables, List<MailAttachment> attachments) {
        boolean sent = sendTemplateMail(to, subject, templatePath, variables, attachments);
        return CompletableFuture.completedFuture(sent);
    }

    /**
     * Sends the official onboarding welcome email to a newly created distributor.
     * Dispatched asynchronously on {@code mailExecutor} so it doesn't block distributor registration.
     *
     * @param distributor the newly created distributor user
     * @param rawPassword temporary plain-text password (if assigned during creation)
     * @param attachments optional attachments (e.g. agreement PDF, guidelines)
     * @return CompletableFuture resolving to true if sent successfully
     */
    @Async("mailExecutor")
    public CompletableFuture<Boolean> sendDistributorOnboardEmail(User distributor, String rawPassword, List<MailAttachment> attachments) {
        if (distributor == null || !StringUtils.hasText(distributor.getEmail())) {
            log.warn("Distributor onboarding email skipped: distributor or email is missing.");
            return CompletableFuture.completedFuture(false);
        }

        String to = distributor.getEmail().trim();
        String subject = "Welcome to IPTSP S&D - Your Distributor Account Details";

        Map<String, Object> variables = new HashMap<>();
        variables.put("fullName", distributor.getFullName());
        variables.put("username", distributor.getUsername());
        variables.put("rawPassword", rawPassword != null ? rawPassword : "");
        variables.put("status", distributor.getStatus() != null ? distributor.getStatus() : "ACTIVE");
        variables.put("phone", distributor.getPhone() != null ? distributor.getPhone() : "N/A");
        variables.put("email", distributor.getEmail());

        if (distributor.getCreditLimit() != null && distributor.getCreditLimit().compareTo(BigDecimal.ZERO) > 0) {
            variables.put("creditLimit", String.format("%,.2f", distributor.getCreditLimit()));
        } else {
            variables.put("creditLimit", "0.00");
        }

        if (distributor.getDiscountRate() != null && distributor.getDiscountRate().compareTo(BigDecimal.ZERO) > 0) {
            variables.put("discountRate", distributor.getDiscountRate().stripTrailingZeros().toPlainString());
        } else {
            variables.put("discountRate", "0");
        }

        variables.put("address", distributor.getAddress() != null ? distributor.getAddress() : "");
        variables.put("portalUrl", portalUrl);

        String onboardDate = distributor.getCreatedAt() != null
                ? distributor.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy"))
                : java.time.LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy"));
        variables.put("onboardedDate", onboardDate);

        boolean sent = sendTemplateMail(to, subject, "mail/distributor-onboard", variables, attachments);
        return CompletableFuture.completedFuture(sent);
    }

    /**
     * Convenience method to send distributor onboarding email without attachments.
     */
    @Async("mailExecutor")
    public CompletableFuture<Boolean> sendDistributorOnboardEmail(User distributor, String rawPassword) {
        return sendDistributorOnboardEmail(distributor, rawPassword, Collections.emptyList());
    }

    /**
     * Convenience method to send distributor onboarding email without password or attachments.
     */
    @Async("mailExecutor")
    public CompletableFuture<Boolean> sendDistributorOnboardEmail(User distributor) {
        return sendDistributorOnboardEmail(distributor, null, Collections.emptyList());
    }
}