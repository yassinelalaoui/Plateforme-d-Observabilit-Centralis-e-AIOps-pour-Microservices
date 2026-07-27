package com.aiops.userservice.api;

import com.aiops.userservice.model.User;
import com.aiops.userservice.service.UserQueryService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {
    private final UserQueryService userQueryService;
    public UserController(UserQueryService userQueryService) { this.userQueryService = userQueryService; }
    @GetMapping("/users") public Map<String, List<User>> users() { return Map.of("users", userQueryService.getUsers()); }
}
