package com.tennismatch.backend.services.impl;

import com.tennismatch.backend.domain.dto.location.LocationDto;
import com.tennismatch.backend.domain.dto.location.LocationPatchDto;
import com.tennismatch.backend.domain.entries.UserLocation;
import com.tennismatch.backend.domain.entries.UserProfile;
import com.tennismatch.backend.cache.CacheVersionService;
import com.tennismatch.backend.repositories.UserLocationRepository;
import com.tennismatch.backend.repositories.UserProfileRepository;
import com.tennismatch.backend.services.LocationUpdateLimitExceededException;
import com.tennismatch.backend.services.LocationUpdateRateLimiter;
import com.tennismatch.backend.services.OnboardingStatusService;
import com.tennismatch.backend.services.UserLocationService;
import com.tennismatch.backend.utils.GeoFactory;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class UserLocationServiceImpl implements UserLocationService {

    private final UserLocationRepository locRepo;
    private final UserProfileRepository userRepo;
    private final GeoFactory geoFactory;
    private final OnboardingStatusService onboardingStatusService;
    private final CacheVersionService cacheVersionService;
    private final LocationUpdateRateLimiter locationUpdateRateLimiter;

    // ====================== by username (auth.getName()) ======================


    @Transactional
    @Override
    public LocationDto getForUser(String username) {
        UserProfile user = resolveUser(username);
        return locRepo.findByUser(user).map(this::toDto).orElse(null);
    }

    @Transactional
    @Override
    public LocationDto upsertPatch(String username, LocationPatchDto patch) {
        if (patch == null) throw new IllegalArgumentException("Empty patch");

        // field validation
        boolean hasLat = patch.getLatitude() != null;
        boolean hasLon = patch.getLongitude() != null;
        if (hasLat ^ hasLon) {
            throw new IllegalArgumentException("latitude and longitude must be provided together");
        }
        if (hasLat) {
            double lat = patch.getLatitude();
            double lon = patch.getLongitude();
            if (lat < -90 || lat > 90) throw new IllegalArgumentException("latitude must be in [-90, 90]");
            if (lon < -180 || lon > 180) throw new IllegalArgumentException("longitude must be in [-180, 180]");
        }
        if (patch.getAccuracy_m() != null && patch.getAccuracy_m() < 0) {
            throw new IllegalArgumentException("accuracy_m must be >= 0");
        }

        UserProfile user = resolveUser(username);
        UserLocation loc = locRepo.findByUser(user).orElseGet(() ->
                UserLocation.builder()
                        .user(user)
                        .updatedAt(OffsetDateTime.now(ZoneOffset.UTC))
                        .build()
        );

        boolean hasLatLon = patch.getLatitude() != null && patch.getLongitude() != null;
        if (hasLatLon && loc.getLocation() != null) {
            if (!locationUpdateRateLimiter.allow(username)) {
                throw new LocationUpdateLimitExceededException(
                        "Limits are exceeded for today, try tomorrow."
                );
            }
        }

        applyPatch(loc, patch); // throws if we can't build a valid point
        loc.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));

        UserLocation saved = locRepo.save(loc);
        onboardingStatusService.markLocationCompleted(user);
        cacheVersionService.bumpDeckVersion(user.getId());
        return toDto(saved);
    }

    @Transactional
    @Override
    public void deleteForUser(String username) {
        UserProfile user = resolveUser(username);
        locRepo.deleteByUser(user);
        cacheVersionService.bumpDeckVersion(user.getId());
    }

    // ====================== helpers ======================

    private UserProfile resolveUser(String username) {
        return userRepo.findByEmail(username)
                .orElseThrow(() -> new NoSuchElementException("Пользователь не найден: " + username));
    }

    private LocationDto toDto(UserLocation ul) {
        LocationDto dto = new LocationDto();
        Point p = ul.getLocation();
        dto.setLatitude(p.getY());
        dto.setLongitude(p.getX());
        dto.setAccuracy_m(ul.getAccuracyM());
        dto.setUpdated_at(ul.getUpdatedAt().toString());
        dto.setPlaceName(ul.getPlaceName());
        return dto;
    }

    private void applyPatch(UserLocation ul, LocationPatchDto patch) {
        // if record is new, coordinates are required
        boolean isNew = (ul.getLocation() == null);

        if (patch.getLatitude() != null && patch.getLongitude() != null) {
            ul.setLocation(geoFactory.pointFromLatLon(patch.getLatitude(), patch.getLongitude()));
        } else if (isNew) {
            throw new IllegalArgumentException("latitude and longitude are required for initial set");
        }

        if (patch.getAccuracy_m() != null) {
            ul.setAccuracyM(patch.getAccuracy_m());
        } else if (isNew) {
            // for the first record, allow null — uncomment to require it:
            // throw new IllegalArgumentException("accuracy_m is required for initial set");
        }

        if (patch.getPlaceName() != null) {
            String name = patch.getPlaceName().trim();
            ul.setPlaceName(name.isEmpty() ? null : name);
        }
    }
}


