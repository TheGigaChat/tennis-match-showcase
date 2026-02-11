package com.tennismatch.backend.services;

import com.tennismatch.backend.domain.dto.PhotoDto;
import jakarta.transaction.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

public interface PhotoService {

    // ====================== USERNAME variants (auth.getName()) ======================
    @Transactional
    PhotoDto uploadOrReplace(String username, MultipartFile file);

    @Transactional
    Optional<PhotoDto> getUserPhoto(String username);

    @Transactional
    void deleteUserPhoto(String username);

    @Transactional
    PhotoDto setUserPhotoUrl(String username, String url);

    @Transactional
    Optional<PhotoDto> getUserPhotoById(Long userId);
}
