package com.aiops.userservice.client;

public class OrderServiceUnavailableException extends RuntimeException {
    public OrderServiceUnavailableException(Throwable cause) { super("Order Service is unavailable", cause); }
}
