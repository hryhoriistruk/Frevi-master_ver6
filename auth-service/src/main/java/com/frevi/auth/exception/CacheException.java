package com.frevi.auth.exception;

public class CacheException extends RuntimeException {
    public CacheException() {
      super("Exception occurred while caching habit.");
    }

    public CacheException(String message) {
        super(message);
    }
}
