package com.frevi.auth.event;

public record UserRegistrationEvent(String id,
                                    String email,
                                    String password) {
}
