package com.frevi.auth.response;

public record SignUpResponse(Long userId,
                             String username,
                             String email) {
}
