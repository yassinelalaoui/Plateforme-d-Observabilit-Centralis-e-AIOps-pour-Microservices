package com.aiops.userservice.api;

import com.aiops.userservice.client.OrderServiceUnavailableException;
import com.aiops.userservice.model.User;
import com.aiops.userservice.service.UserQueryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {UserController.class, ApiExceptionHandler.class})
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserQueryService userQueryService;

    @Test
    void testGetUsersSuccess() throws Exception {
        User user1 = new User("user-1", "Ada Lovelace", List.of());
        when(userQueryService.getUsers()).thenReturn(List.of(user1));

        mockMvc.perform(get("/users"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.users[0].id").value("user-1"))
                .andExpect(jsonPath("$.users[0].name").value("Ada Lovelace"))
                .andExpect(jsonPath("$.users[0].orders").isArray());
    }

    @Test
    void testGetUsersServiceUnavailable() throws Exception {
        when(userQueryService.getUsers()).thenThrow(new OrderServiceUnavailableException(new RuntimeException("Order Service is down")));

        mockMvc.perform(get("/users"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value("ORDER_SERVICE_UNAVAILABLE"))
                .andExpect(jsonPath("$.message").value("Order Service is unavailable."));
    }
}
