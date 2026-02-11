package com.tennismatch.backend.repositories;

import com.tennismatch.backend.domain.entries.UserLocation;
import com.tennismatch.backend.domain.entries.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserLocationRepository extends JpaRepository<UserLocation, Long> {
    Optional<UserLocation> findByUser(UserProfile user);
    void deleteByUser(UserProfile user);
}
