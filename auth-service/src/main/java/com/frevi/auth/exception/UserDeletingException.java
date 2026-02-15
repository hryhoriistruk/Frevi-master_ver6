package com.frevi.auth.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class UserDeletingException extends RuntimeException {
    private final HttpStatus status;

    public UserDeletingException(HttpStatus status, String message) {
        super(message + " Response code:" + status);

        this.status = status;
    }

    public UserDeletingException(HttpStatus status) {
        this(status, "User wasn`t deleted successfully. Response code: ");
    }
}
