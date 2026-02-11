package com.tennismatch.backend.services;


import com.tennismatch.backend.domain.dto.location.LocationDto;
import com.tennismatch.backend.domain.dto.location.LocationPatchDto;

public interface UserLocationService {
    LocationDto getForUser(String username);              // null => no record
    LocationDto upsertPatch(String username, LocationPatchDto patch);
    void deleteForUser(String username);
}
