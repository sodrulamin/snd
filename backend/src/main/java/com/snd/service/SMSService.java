package com.snd.service;

import com.snd.model.PartnerProfile;
import com.snd.model.User;
import com.snd.util.MsisdnUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.net.URI;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.CompletableFuture;

import org.springframework.scheduling.annotation.Async;

/**
 * Service for sending SMS messages via the DigitalSquare iSMS gateway.
 *
 * <p>Configuration (application.yml / environment variables):
 * <pre>
 *   app.sms.base-url   - gateway endpoint  (env: APP_SMS_BASE_URL)
 *   app.sms.api-key    - API key           (env: APP_SMS_API_KEY)
 *   app.sms.secret-key - secret key        (env: APP_SMS_SECRET_KEY)
 *   app.sms.caller-id  - sender CLI number (env: APP_SMS_CALLER_ID)
 * </pre>
 */
@Slf4j
@Service
public class SMSService {

    private final RestClient restClient;

    @Value("${app.sms.base-url}")
    private String baseUrl;

    @Value("${app.sms.api-key}")
    private String apiKey;

    @Value("${app.sms.secret-key}")
    private String secretKey;

    @Value("${app.sms.caller-id}")
    private String callerId;

    public SMSService() {
        this.restClient = RestClient.builder()
                .defaultHeader("Accept", "text/plain, application/json, */*")
                .build();
    }

    /**
     * Builds a welcome SMS for a newly onboarded distributor.
     *
     * <p>The message includes:
     * <ul>
     *   <li>Personalised greeting using the distributor's first name</li>
     *   <li>Login credentials (username)</li>
     *   <li>Account summary — credit limit and discount rate</li>
     *   <li>Onboarding date</li>
     *   <li>Support contact footer</li>
     * </ul>
     *
     * @param user the newly created distributor {@link User}
     * @return formatted SMS body string, ready to pass to {@link #sendSms}
     */
    public String createDistributorOnboardMessage(User user) {
        PartnerProfile profile = user != null ? user.getPartnerProfile() : null;
        String fullName = profile != null && profile.getFullName() != null ? profile.getFullName() : (user != null ? user.getUsername() : "Distributor");

        // Format join date
        String joinDate = user != null && user.getCreatedAt() != null
                ? user.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy"))
                : "Today";
//
//        // Credit limit — show only if non-zero
//        String creditLine = "";
//        BigDecimal creditLimit = profile != null ? profile.getCreditLimit() : null;
//        if (creditLimit != null && creditLimit.compareTo(BigDecimal.ZERO) > 0) {
//            creditLine = " Credit Limit: BDT " + String.format("%,.2f", creditLimit) + ".";
//        }
//
//        // Discount rate — show only if non-zero
//        String discountLine = "";
//        BigDecimal discountRate = profile != null ? profile.getDiscountRate() : null;
//        if (discountRate != null && discountRate.compareTo(BigDecimal.ZERO) > 0) {
//            discountLine = " Discount Rate: " + discountRate.stripTrailingZeros().toPlainString() + "%.";
//        }

        return String.format(
                "Welcome to IPTSP Sales and Distribution, %s!, Your distributor account is now ACTIVE. Username: %s. Joined: %s",
                fullName,
                user != null ? user.getUsername() : "",
                joinDate
        );
    }

    /**
     * Sends an SMS to the given recipient number asynchronously on the
     * {@code smsExecutor} thread pool, so the calling thread is never blocked
     * by gateway I/O.
     *
     * <p>The number is automatically normalised to the Bangladeshi international
     * format {@code 8801XXXXXXXXX} before the request is dispatched.
     *
     * @param toNumber       Recipient in any supported format (see {@link MsisdnUtil#normalize})
     * @param messageContent Plain-text message body (URL-encoded automatically)
     * @return a {@link CompletableFuture} that resolves to {@code true} on HTTP 2xx,
     *         {@code false} on any non-2xx response or exception
     */
    @Async("smsExecutor")
    public CompletableFuture<Boolean> sendSms(String toNumber, String messageContent) {
        try {
            // Normalise to full Bangladeshi international format (8801XXXXXXXXX).
            String normalizedNumber = MsisdnUtil.normalize(toNumber);

            URI uri = UriComponentsBuilder.fromUriString(baseUrl)
                    .queryParam("apikey",         apiKey)
                    .queryParam("secretkey",      secretKey)
                    .queryParam("callerID",       callerId)
                    .queryParam("toUser",         normalizedNumber)
                    .queryParam("messageContent", messageContent)
                    .build()
                    .toUri();

            log.info("Sending SMS to {} (normalised from '{}') via {}", normalizedNumber, toNumber, baseUrl);

            ResponseEntity<String> response = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .toEntity(String.class);

            boolean success = response.getStatusCode().is2xxSuccessful();

            if (success) {
                log.info("SMS sent successfully to {}. Gateway response: {}", normalizedNumber, response.getBody());
            } else {
                log.warn("SMS gateway returned non-2xx status {} for recipient {}. Body: {}",
                        response.getStatusCode(), normalizedNumber, response.getBody());
            }

            return CompletableFuture.completedFuture(success);

        } catch (Exception ex) {
            log.error("Failed to send SMS to {}: {}", toNumber, ex.getMessage(), ex);
            return CompletableFuture.completedFuture(false);
        }
    }
}