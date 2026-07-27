package com.aiops.userservice.model;

import java.util.List;

public record User(String id, String name, List<OrderSummary> orders) {}
