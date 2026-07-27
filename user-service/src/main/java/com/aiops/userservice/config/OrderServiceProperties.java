package com.aiops.userservice.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "order-service")
public record OrderServiceProperties(String baseUrl, Duration timeout) {
    public OrderServiceProperties {
        if (baseUrl == null || baseUrl.isBlank()) throw new IllegalArgumentException("order-service.base-url is required");
        if (timeout == null || timeout.isNegative() || timeout.isZero()) throw new IllegalArgumentException("order-service.timeout must be positive");
    }
}
