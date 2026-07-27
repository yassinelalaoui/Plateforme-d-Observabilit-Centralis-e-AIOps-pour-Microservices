package com.aiops.userservice.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OrderSummary(UUID id, String userId, String description, BigDecimal amount, String status, Instant createdAt) {}
