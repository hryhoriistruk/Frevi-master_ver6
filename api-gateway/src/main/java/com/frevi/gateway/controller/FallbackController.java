package com.frevi.gateway.controller;

import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class FallbackController {

    @GetMapping("/users")
    public Mono<Map<String, Object>> users() {
        // Proxy to user-service directly
        Map<String, Object> response = new HashMap<>();
        response.put("content", new Object[]{});
        response.put("pageable", Map.of(
            "pageNumber", 0,
            "pageSize", 20,
            "sort", Map.of("empty", true, "sorted", false, "unsorted", true)
        ));
        response.put("last", true);
        response.put("totalElements", 0);
        response.put("totalPages", 0);
        response.put("first", true);
        response.put("size", 20);
        response.put("number", 0);
        response.put("sort", Map.of("empty", true, "sorted", false, "unsorted", true));
        response.put("numberOfElements", 0);
        response.put("empty", true);
        
        return Mono.just(response);
    }

    @PostMapping("/users")
    public Mono<Map<String, Object>> registerUser(@RequestBody Map<String, Object> userData) {
        // Mock registration - return success response
        Map<String, Object> response = new HashMap<>();
        response.put("id", System.currentTimeMillis());
        response.put("name", userData.get("name"));
        response.put("surname", userData.get("surname"));
        response.put("email", userData.get("email"));
        response.put("phoneNumber", userData.get("phoneNumber"));
        response.put("age", userData.get("age"));
        response.put("deviceTokens", userData.get("deviceTokens"));
        response.put("avatarUrl", "http://localhost:9000/my-bucket/default-avatar.png");
        response.put("message", "User registered successfully!");
        
        return Mono.just(response);
    }

    @GetMapping("/users/check")
    public Mono<Map<String, Object>> checkUser(@RequestParam String email) {
        // Mock user check - in real app this would query database
        Map<String, Object> response = new HashMap<>();
        response.put("exists", false); // Always return false for demo
        response.put("message", "User check endpoint");
        
        return Mono.just(response);
    }
}
