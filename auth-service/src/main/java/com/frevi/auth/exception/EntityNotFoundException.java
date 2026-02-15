package com.frevi.auth.exception;

public class EntityNotFoundException extends RuntimeException {
    public EntityNotFoundException() {
        super("Entity Not Found");
    }

    public EntityNotFoundException(String message) {
        super(message);
    }
}
