package com.tennismatch.backend.repositories;

import com.tennismatch.backend.domain.entries.OnboardingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OnboardingStatusRepository extends JpaRepository<OnboardingStatus, Long> {
}
