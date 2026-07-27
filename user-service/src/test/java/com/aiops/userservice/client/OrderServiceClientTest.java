package com.aiops.userservice.client;

import com.aiops.userservice.config.OrderServiceProperties;
import com.aiops.userservice.model.OrderSummary;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class OrderServiceClientTest {

    private OrderServiceProperties properties;
    private OrderServiceClient client;
    private RestClient mockRestClient;

    @BeforeEach
    void setUp() throws Exception {
        properties = new OrderServiceProperties("http://localhost:8081", Duration.ofSeconds(2));
        mockRestClient = mock(RestClient.class);
        client = new OrderServiceClient(properties);
        
        // Use reflection to set the private client field to the mock
        java.lang.reflect.Field field = OrderServiceClient.class.getDeclaredField("client");
        field.setAccessible(true);
        field.set(client, mockRestClient);
    }

    @Test
    void testGetOrdersSuccess() {
        RestClient.RequestHeadersUriSpec uriSpec = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.RequestHeadersSpec headersSpec = mock(RestClient.RequestHeadersSpec.class);
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);

        when(mockRestClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri("/orders")).thenReturn(headersSpec);
        when(headersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.onStatus(any(), any())).thenReturn(responseSpec);
        
        OrderSummary summary = new OrderSummary(UUID.randomUUID(), "user-1", "Test order", new BigDecimal("10.00"), "CONFIRMED", Instant.now());
        OrderServiceClient.OrdersResponse mockResponse = new OrderServiceClient.OrdersResponse(List.of(summary));
        when(responseSpec.body(OrderServiceClient.OrdersResponse.class)).thenReturn(mockResponse);

        List<OrderSummary> result = client.getOrders();
        assertEquals(1, result.size());
        assertEquals("user-1", result.get(0).userId());
        assertEquals(new BigDecimal("10.00"), result.get(0).amount());
    }

    @Test
    void testGetOrdersFailure() {
        RestClient.RequestHeadersUriSpec uriSpec = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.RequestHeadersSpec headersSpec = mock(RestClient.RequestHeadersSpec.class);
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);

        when(mockRestClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri("/orders")).thenReturn(headersSpec);
        when(headersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.onStatus(any(), any())).thenReturn(responseSpec);
        
        when(responseSpec.body(OrderServiceClient.OrdersResponse.class)).thenThrow(new RestClientException("Connection failed"));

        assertThrows(OrderServiceUnavailableException.class, () -> client.getOrders());
    }

    @Test
    void testGetOrdersEmptyResponse() {
        RestClient.RequestHeadersUriSpec uriSpec = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.RequestHeadersSpec headersSpec = mock(RestClient.RequestHeadersSpec.class);
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);

        when(mockRestClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri("/orders")).thenReturn(headersSpec);
        when(headersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.onStatus(any(), any())).thenReturn(responseSpec);
        
        when(responseSpec.body(OrderServiceClient.OrdersResponse.class)).thenReturn(new OrderServiceClient.OrdersResponse(null));

        assertThrows(OrderServiceUnavailableException.class, () -> client.getOrders());
    }
}
