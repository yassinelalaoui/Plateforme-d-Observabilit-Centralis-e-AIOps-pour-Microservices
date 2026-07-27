package com.aiops.userservice.api;

import com.aiops.userservice.client.OrderServiceUnavailableException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(OrderServiceUnavailableException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    Map<String, String> orderUnavailable() {
        return Map.of("code", "ORDER_SERVICE_UNAVAILABLE", "message", "Order Service is unavailable.");
    }
}
