package com.tennismatch.backend.services.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import com.tennismatch.backend.configs.CacheConfig;
import com.tennismatch.backend.domain.dto.PhotoDto;
import com.tennismatch.backend.domain.entries.Photo;
import com.tennismatch.backend.domain.entries.UserProfile;
import com.tennismatch.backend.repositories.PhotoRepository;
import com.tennismatch.backend.repositories.UserProfileRepository;
import com.tennismatch.backend.services.OnboardingStatusService;
import com.tennismatch.backend.services.PhotoService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PhotoServiceImpl implements PhotoService {

    private final Cloudinary cloudinary;
    private final PhotoRepository photoRepo;
    private final UserProfileRepository userRepo;
    private final OnboardingStatusService onboardingStatusService;

    @Value("${cloudinary.folder:tennis-match/profile}")
    private String cloudFolder;

    @Value("${cloudinary.delivery.maxWidth:1024}")
    private int deliveryMaxWidth;

    private static final String CONSTANT_PHOTOS_PREFIX = "constant_photos/";

    private static final Set<String> ALLOWED_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            "image/webp"
    );

    @Transactional
    @Override
    @CacheEvict(cacheNames = CacheConfig.PROFILE_ME_CACHE, key = "#username")
    public PhotoDto setUserPhotoUrl(String username, String url) {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("Photo URL is required");
        }
        UserProfile user = resolveUser(username);
        String oldPublicId = photoRepo.findByUser(user).map(Photo::getPublicId).orElse(null);
        Photo photo = photoRepo.findByUser(user)
                .map(p -> { p.setUrl(url); p.setPublicId(null); return p; })
                .orElseGet(() -> Photo.builder()
                        .user(user)
                        .url(url)
                        .publicId(null)
                        .build());
        Photo saved = photoRepo.save(photo);
        onboardingStatusService.markProfilePhotoCompleted(user);
        destroyIfDeletable(oldPublicId);
        return toDto(saved);
    }

    // ====================== USERNAME variants (auth.getName()) ======================
    @Transactional
    @Override
    @CacheEvict(cacheNames = CacheConfig.PROFILE_ME_CACHE, key = "#username")
    public PhotoDto uploadOrReplace(String username, MultipartFile file) {
        UserProfile user = resolveUser(username);
        return uploadOrReplace(user.getId(), file); // reuse id-based logic below
    }

    @Transactional
    @Override
    public Optional<PhotoDto> getUserPhoto(String username) {
        UserProfile user = resolveUser(username);
        return getUserPhotoById(user.getId());
    }

    @Transactional
    @Override
    @CacheEvict(cacheNames = CacheConfig.PROFILE_ME_CACHE, key = "#username")
    public void deleteUserPhoto(String username) {
        UserProfile user = resolveUser(username);
        deleteUserPhoto(user.getId());
    }

    // ====================== MAIN ID-BASED METHODS (interface compatibility) ======================

    /**
     * Uploads photo to Cloudinary and either creates a Photo record or updates the existing one (one photo per user).
     */
    @Transactional
    public PhotoDto uploadOrReplace(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Файл не передан или пустой");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Недопустимый тип файла: " + file.getContentType());
        }

        UserProfile user = userRepo.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("Пользователь не найден: id=" + userId));

        String oldPublicId = photoRepo.findByUser(user).map(Photo::getPublicId).orElse(null);

        // 1) upload original
        Map<String, Object> options = ObjectUtils.asMap(
                "folder", cloudFolder,
                "overwrite", true,
                "resource_type", "image"
        );

        Map<?, ?> uploadResult;
        try {
            uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
        } catch (Exception e) {
            throw new RuntimeException("Ошибка загрузки в Cloudinary", e);
        }

        // 2) build optimized delivery URL from public_id
        String publicId = Objects.toString(uploadResult.get("public_id"), null);
        if (publicId == null) {
            throw new IllegalStateException("Cloudinary не вернул public_id");
        }

        Number version = (Number) uploadResult.get("version");

        String deliveryUrl = cloudinary.url()
                .secure(true)
                .resourceType("image")
                .type("upload")
                .version(version != null ? version.longValue() : null)
                .transformation(new Transformation()
                        .fetchFormat("auto")
                        .quality("auto")
                        .width(deliveryMaxWidth)
                        .crop("limit"))
                .generate(publicId);

        // 3) save/update record
        Photo photo = photoRepo.findByUser(user)
                .map(p -> { p.setUrl(deliveryUrl); p.setPublicId(publicId); return p; })
                .orElseGet(() -> Photo.builder()
                        .user(user)
                        .url(deliveryUrl)
                        .publicId(publicId)
                        .build());

        System.out.println(deliveryUrl);

        Photo saved = photoRepo.save(photo);
        onboardingStatusService.markProfilePhotoCompleted(user);
        if (oldPublicId != null && !oldPublicId.equals(publicId)) {
            destroyIfDeletable(oldPublicId);
        }
        return toDto(saved);
    }

    @Transactional
    @Override
    public Optional<PhotoDto> getUserPhotoById(Long userId) {
        UserProfile user = userRepo.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("Пользователь не найден: id=" + userId));
        return photoRepo.findByUser(user).map(this::toDto);
    }

    @Transactional
    public void deleteUserPhoto(Long userId) {
        UserProfile user = userRepo.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("DYD_D??OD?D_D?D??,D?D??O D?D? D?D?D1D'D?D?: id=" + userId));
        photoRepo.findByUser(user).map(Photo::getPublicId).ifPresent(this::destroyIfDeletable);
        photoRepo.deleteByUser(user);
    }

    // ====================== UTILS ======================

    private void destroyIfDeletable(String publicId) {
        if (publicId == null || publicId.isBlank()) return;
        if (publicId.startsWith(CONSTANT_PHOTOS_PREFIX)) return;
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "image"));
        } catch (Exception ignored) {
            // Best-effort deletion; no user-facing impact.
        }
    }

    /** Find user by username (email). Replace with findByUsername if you use a different login. */
    private UserProfile resolveUser(String username) {
        return userRepo.findByEmail(username)
                .orElseThrow(() -> new NoSuchElementException("Пользователь не найден: " + username));
    }

    private PhotoDto toDto(Photo p) {
        return PhotoDto.builder()
                .id(p.getId())
                .url(p.getUrl())
                .build();
    }
}
