package com.tennismatch.backend.controllers;

import com.tennismatch.backend.domain.dto.PreferenceDto;
import com.tennismatch.backend.services.PreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.NoSuchElementException;

@RestController
@RequestMapping("/profile/preferences")
@RequiredArgsConstructor
public class PreferenceController {

    private final PreferenceService prefService;

    /** GET: return current user preferences or 204 */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> get(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        try {
            var dto = prefService.getForUser(auth.getName());
            return (dto == null) ? ResponseEntity.noContent().build() : ResponseEntity.ok(dto);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).build();
        }
    }

    /** PATCH: partial update (upsert) */
    @PatchMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> patch(@RequestBody PreferenceDto patch, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        try {
            var updated = prefService.upsertPatch(auth.getName(), patch);
            return ResponseEntity.ok(updated); // frontend can handle 204 or 200 — 200 is more convenient
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(iae.getMessage());
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).build();
        }
    }

    /** DELETE: remove preferences record (optional) */
    @DeleteMapping
    public ResponseEntity<Void> delete(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        prefService.deleteForUser(auth.getName());
        return ResponseEntity.noContent().build();
    }
}
