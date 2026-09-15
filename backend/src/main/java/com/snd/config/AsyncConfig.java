package com.snd.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Async execution configuration.
 *
 * <p>Defines a dedicated thread pool for SMS dispatching so that
 * gateway I/O never blocks the main request thread.
 *
 * <p>Thread pool sizing (tunable via environment variables):
 * <pre>
 *   Core threads  : 2   (always-alive, handles typical load)
 *   Max threads   : 10  (burst capacity)
 *   Queue capacity: 200 (pending SMS tasks before rejection)
 * </pre>
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Executor used by {@code @Async("smsExecutor")} in {@link com.snd.service.SMSService}.
     */
    @Bean(name = "smsExecutor")
    public Executor smsExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("sms-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }

    /**
     * Executor used by {@code @Async("mailExecutor")} in {@link com.snd.service.MailService}.
     */
    @Bean(name = "mailExecutor")
    public Executor mailExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("mail-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}