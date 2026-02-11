package com.tennismatch.backend.chat.services.impl;

import com.tennismatch.backend.chat.domain.dto.ConversationDetailsDto;
import com.tennismatch.backend.chat.repositories.ConversationRepository;
import com.tennismatch.backend.chat.services.ConversationMetaService;
import com.tennismatch.backend.configs.CacheConfig;
import com.tennismatch.backend.repositories.PhotoRepository;
import com.tennismatch.backend.repositories.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ConversationMetaServiceImpl implements ConversationMetaService {

    private final ConversationRepository conversationRepo;
    private final UserProfileRepository userRepo;
    private final PhotoRepository photoRepo;


//    @Cacheable(
//            cacheNames = CacheConfig.CONV_META_CACHE,
//            key = "T(java.lang.String).format('%d:%d', #meId, #conversationId)",
//            unless = "#result == null"
//    )
    @Override
    public ConversationDetailsDto loadForUser(long meId, long conversationId) {
        var row = conversationRepo.findOneForUser(meId, conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        var pid = row.getPartnerId();

        var name = userRepo.findNamesByIds(List.of(pid)).stream()
                .findFirst().map(UserProfileRepository.IdNameRow::getName)
                .filter(s -> s != null && !s.isBlank())
                .orElse("Player " + pid);

        var avatar = photoRepo.findPrimaryOrLatestByUserIds(new Long[]{pid}).stream()
                .findFirst().map(PhotoRepository.UserPhotoRow::getUrl)
                .orElse(null);

        return ConversationDetailsDto.builder()
                .id(row.getConversationId())
                .status(row.getStatus())
                .lastMessageAt(row.getLastMessageAt() != null ? row.getLastMessageAt() : row.getCreatedAt())
                .partner(new ConversationDetailsDto.PartnerDto(pid, name, avatar))
                .build();
    }
}
