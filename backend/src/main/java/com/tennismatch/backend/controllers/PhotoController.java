package com.tennismatch.backend.controllers;

import com.tennismatch.backend.domain.dto.PhotoDto;
import com.tennismatch.backend.services.PhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.NoSuchElementException;

@RestController
@RequestMapping("/profile/photo")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService photoService;

    /** Upload or replace photo (multipart/form-data) */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PhotoDto> uploadOrReplace(@RequestParam("file") MultipartFile file,
                                                    Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        try {
            return ResponseEntity.ok(photoService.uploadOrReplace(auth.getName(), file));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).build();
        }
    }

    /** Get current user photo (URL) */
    @GetMapping
    public ResponseEntity<PhotoDto> get(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return photoService.getUserPhoto(auth.getName())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /** Delete user photo record */
    @DeleteMapping
    public ResponseEntity<Void> delete(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        photoService.deleteUserPhoto(auth.getName());
        return ResponseEntity.noContent().build();
    }
}
