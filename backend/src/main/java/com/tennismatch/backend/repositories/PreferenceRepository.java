package com.tennismatch.backend.repositories;

import com.tennismatch.backend.domain.entries.Preference;
import com.tennismatch.backend.domain.entries.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PreferenceRepository extends JpaRepository<Preference, Long> {
    Optional<Preference> findByUser(UserProfile user);
    void deleteByUser(UserProfile user);
}
