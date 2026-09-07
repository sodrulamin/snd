package com.snd.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.*;

@Aspect
@Component
@Slf4j
public class LoggingAspect {

    private final ObjectMapper objectMapper;

    public LoggingAspect() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
    }

    @Pointcut("within(@org.springframework.web.bind.annotation.RestController *) || execution(* com.snd.controller..*(..))")
    public void controllerPointcut() {
    }

    @Around("controllerPointcut()")
    public Object logRequestResponse(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString().substring(0, 8);

        HttpServletRequest request = null;
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            request = attributes.getRequest();
        }

        String httpMethod = request != null ? request.getMethod() : "N/A";
        String requestUri = request != null ? request.getRequestURI() : "N/A";
        String queryString = request != null ? request.getQueryString() : null;
        String clientIp = getClientIp(request);
        String username = getAuthenticatedUsername();

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String className = signature.getDeclaringType().getSimpleName();
        String methodName = signature.getName();
        String[] paramNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        Map<String, Object> requestParams = sanitizeArguments(paramNames, args);

        log.info("========== [REQ START #{} ] ==========", requestId);
        log.info("HTTP: {} {} {}", httpMethod, requestUri, (queryString != null ? "?" + queryString : ""));
        log.info("Client IP: {} | User: {}", clientIp, username);
        log.info("Handler: {}.{}()", className, methodName);
        if (!requestParams.isEmpty()) {
            log.info("Request Body/Params: {}", serializeJson(requestParams));
        }

        Object result;
        try {
            result = joinPoint.proceed();
        } catch (Throwable ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("========== [REQ ERROR #{} | Duration: {} ms] ==========", requestId, duration);
            log.error("Exception in {}.{}(): {}", className, methodName, ex.getMessage(), ex);
            throw ex;
        }

        long duration = System.currentTimeMillis() - startTime;
        log.info("========== [RES END   #{} | Duration: {} ms] ==========", requestId, duration);
        log.info("Response: {}", serializeJson(result));
        log.info("==================================================");

        return result;
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return "N/A";
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String getAuthenticatedUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "ANONYMOUS";
    }

    private Map<String, Object> sanitizeArguments(String[] paramNames, Object[] args) {
        Map<String, Object> map = new LinkedHashMap<>();
        if (paramNames == null || args == null) return map;

        for (int i = 0; i < paramNames.length; i++) {
            if (i < args.length) {
                String name = paramNames[i];
                Object value = args[i];

                // Exclude Servlet request/response objects or internal security credentials
                if (value instanceof jakarta.servlet.ServletRequest || 
                    value instanceof jakarta.servlet.ServletResponse ||
                    value instanceof org.springframework.security.core.userdetails.UserDetails) {
                    continue;
                }

                if (name.toLowerCase().contains("password") || name.toLowerCase().contains("secret") || name.toLowerCase().contains("pin")) {
                    map.put(name, "******");
                } else {
                    map.put(name, value);
                }
            }
        }
        return map;
    }

    private String serializeJson(Object object) {
        if (object == null) return "null";
        try {
            return objectMapper.writeValueAsString(object);
        } catch (Exception e) {
            return String.valueOf(object);
        }
    }
}
