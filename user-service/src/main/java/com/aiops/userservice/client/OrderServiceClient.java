package com.aiops.userservice.client;

import com.aiops.userservice.config.OrderServiceProperties;
import com.aiops.userservice.model.OrderSummary;
import java.util.List;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class OrderServiceClient {
    private final RestClient client;

    public OrderServiceClient(OrderServiceProperties properties) {
        this.client = RestClient.builder().baseUrl(properties.baseUrl()).build();
    }

    public List<OrderSummary> getOrders() {
        try {
            OrdersResponse response = client.get().uri("/orders").retrieve()
                    .onStatus(HttpStatusCode::isError, (request, result) -> {
                        throw new OrderServiceUnavailableException(new IllegalStateException("Order Service status " + result.getStatusCode()));
                    })
                    .body(OrdersResponse.class);
            if (response == null || response.orders() == null) throw new OrderServiceUnavailableException(new IllegalStateException("Empty Order Service response"));
            return response.orders();
        } catch (OrderServiceUnavailableException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new OrderServiceUnavailableException(exception);
        }
    }

    public record OrdersResponse(List<OrderSummary> orders) {}
}
