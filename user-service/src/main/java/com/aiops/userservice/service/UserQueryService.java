package com.aiops.userservice.service;

import com.aiops.userservice.client.OrderServiceClient;
import com.aiops.userservice.model.OrderSummary;
import com.aiops.userservice.model.User;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class UserQueryService {
    private final OrderServiceClient orderServiceClient;
    private final List<UserSeed> users = List.of(new UserSeed("user-1", "Ada Lovelace"), new UserSeed("user-2", "Grace Hopper"));

    public UserQueryService(OrderServiceClient orderServiceClient) { this.orderServiceClient = orderServiceClient; }

    public List<User> getUsers() {
        List<OrderSummary> orders = orderServiceClient.getOrders();
        return users.stream().map(user -> new User(user.id(), user.name(), orders.stream()
                .filter(order -> user.id().equals(order.userId())).toList())).toList();
    }

    private record UserSeed(String id, String name) {}
}
