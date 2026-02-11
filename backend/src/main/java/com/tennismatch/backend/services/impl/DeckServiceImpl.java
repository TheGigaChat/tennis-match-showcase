package com.tennismatch.backend.services.impl;

import com.tennismatch.backend.cache.CacheVersionService;
import com.tennismatch.backend.configs.CacheConfig;
import com.tennismatch.backend.domain.dto.DeckCandidateDto;
import com.tennismatch.backend.repositories.DeckRepository;
import com.tennismatch.backend.repositories.utils.CandidateRow;
import com.tennismatch.backend.services.DeckService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeckServiceImpl implements DeckService {

    private final DeckRepository deckRepo;
    private final CacheVersionService cacheVersionService;

    @Override
    @Transactional
    @Cacheable(cacheNames = CacheConfig.DECK_CACHE,
            key = "#actorId + ':' + #size + ':' + @cacheVersionService.getDeckVersion(#actorId)")
    public List<DeckCandidateDto> getDeck(Long actorId, int size) {
        int s = Math.max(1, size);

        List<CandidateRow> rows = deckRepo.findCandidates(actorId, s);
        if (rows.isEmpty()) return List.of();

        List<DeckCandidateDto> out = new ArrayList<>(rows.size());
        for (CandidateRow r : rows) {
            out.add(DeckCandidateDto.builder()
                    .userId(r.getTargetId())
                    .distanceMeters(r.getDistanceM())
                    .build());
        }
        return out;
    }

}
