package com.tennismatch.backend.services;

public class LocationUpdateLimitExceededException extends RuntimeException {
    public LocationUpdateLimitExceededException(String message) {
        super(message);
    }
}
