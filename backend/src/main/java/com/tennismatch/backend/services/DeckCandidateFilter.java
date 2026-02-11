package com.tennismatch.backend.services;

import com.tennismatch.backend.domain.dto.DeckCandidateDto;
import com.tennismatch.backend.repositories.UserActionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DeckCandidateFilter {

    private final UserActionRepository actionRepository;

    @Transactional(readOnly = true)
    public DeckFilterResult filter(Long actorId, List<DeckCandidateDto> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return new DeckFilterResult(List.of(), 0, 0);
        }

        Set<Long> ids = new HashSet<>();
        for (DeckCandidateDto candidate : candidates) {
            if (candidate.getUserId() != null) {
                ids.add(candidate.getUserId());
            }
        }
        if (ids.isEmpty()) {
            return new DeckFilterResult(List.of(), 0, 0);
        }

        List<Long> swiped = actionRepository.findTargetIdsByActorIdAndTargetIdIn(actorId, ids);
        Set<Long> swipedSet = new HashSet<>(swiped);
        Set<Long> seen = new HashSet<>();
        List<DeckCandidateDto> filtered = new ArrayList<>(candidates.size());
        int removedSwiped = 0;
        int removedDuplicates = 0;

        for (DeckCandidateDto candidate : candidates) {
            Long targetId = candidate.getUserId();
            if (targetId == null) continue;
            if (swipedSet.contains(targetId)) {
                removedSwiped++;
                continue;
            }
            if (!seen.add(targetId)) {
                removedDuplicates++;
                continue;
            }
            filtered.add(candidate);
        }

        return new DeckFilterResult(filtered, removedSwiped, removedDuplicates);
    }

    public record DeckFilterResult(List<DeckCandidateDto> candidates,
                                   int removedSwiped,
                                   int removedDuplicates) {}
}
