package com.tennismatch.backend.services;

import com.tennismatch.backend.domain.dto.DeckCandidateDto;

import java.util.List;

public interface DeckService {
    List<DeckCandidateDto> getDeck(Long actorId, int size);
}
