package com.tennismatch.backend.controllers;

import com.tennismatch.backend.domain.dto.location.GeocodeRequest;
import com.tennismatch.backend.domain.dto.location.GeocodeResponse;
import com.tennismatch.backend.domain.dto.location.LocationDto;
import com.tennismatch.backend.domain.dto.location.LocationPatchDto;
import com.tennismatch.backend.services.GeocodeRateLimiter;
import com.tennismatch.backend.services.LocationUpdateLimitExceededException;
import com.tennismatch.backend.services.MapboxGeocodingService;
import com.tennismatch.backend.services.UserLocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.NoSuchElementException;

@RestController
@RequestMapping("/profile/user-location")
@RequiredArgsConstructor
public class UserLocationController {

    private final UserLocationService locationService;
    private final MapboxGeocodingService geocodingService;
    private final GeocodeRateLimiter geocodeRateLimiter;

    /** GET: return current user location or 204 */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> get(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        try {
            LocationDto dto = locationService.getForUser(auth.getName());
            return (dto == null) ? ResponseEntity.noContent().build() : ResponseEntity.ok(dto);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).build();
        }
    }

    /** PATCH: partial update (upsert) */
    @PatchMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> patch(@RequestBody LocationPatchDto patch, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        try {
            LocationDto updated = locationService.upsertPatch(auth.getName(), patch);
            return ResponseEntity.ok(updated);
        } catch (LocationUpdateLimitExceededException limited) {
            return ResponseEntity.status(429).body(limited.getMessage());
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(iae.getMessage());
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).build();
        }
    }

    /** DELETE: remove location record (optional) */
    @DeleteMapping
    public ResponseEntity<Void> delete(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        locationService.deleteForUser(auth.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> create(@RequestBody LocationPatchDto body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        try {
            var dto = locationService.upsertPatch(auth.getName(), body);
            return ResponseEntity.status(201).body(dto); // 201 Created
        } catch (LocationUpdateLimitExceededException limited) {
            return ResponseEntity.status(429).body(limited.getMessage());
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(iae.getMessage());
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).build();
        }
    }

    @PostMapping(path = "/geocode", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> geocode(@RequestBody GeocodeRequest body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        String query = (body == null || body.query() == null) ? "" : body.query().trim();
        if (query.isEmpty()) return ResponseEntity.badRequest().body("query is required");

        if (!geocodeRateLimiter.allow(auth.getName())) {
            return ResponseEntity.status(429).body("Too many geocode attempts. Please try again later.");
        }

        try {
            return geocodingService.geocode(query)
                    .<ResponseEntity<?>>map(r -> ResponseEntity.ok(new GeocodeResponse(
                            r.latitude(), r.longitude(), r.placeName()
                    )))
                    .orElseGet(() -> ResponseEntity.status(404).body("No results"));
        } catch (IllegalStateException ise) {
            return ResponseEntity.status(503).body("Geocoding unavailable");
        } catch (Exception e) {
            return ResponseEntity.status(502).body("Geocoding failed");
        }
    }
}
