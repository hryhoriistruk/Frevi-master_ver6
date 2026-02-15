package com.frevi.auth.request;

public record SignUpRequest(String name,
                            String surname,
                            String email,
                            String password) {
}
