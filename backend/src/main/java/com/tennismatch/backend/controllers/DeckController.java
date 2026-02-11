package com.tennismatch.backend.controllers;

import com.tennismatch.backend.domain.dto.DeckCandidateDto;
import com.tennismatch.backend.domain.dto.requests.PostDecisionRequest;
import com.tennismatch.backend.domain.dto.responses.GetDeckResponse;
import com.tennismatch.backend.domain.dto.responses.PostDecisionResponse;
import com.tennismatch.backend.domain.entries.UserProfile;
import com.tennismatch.backend.services.DecisionService;
import com.tennismatch.backend.services.DecisionOutcome;
import com.tennismatch.backend.services.DeckCandidateFilter;
import com.tennismatch.backend.services.DeckService;
import com.tennismatch.backend.services.DeckSessionService;
import com.tennismatch.backend.repositories.PhotoRepository;
import com.tennismatch.backend.repositories.UserProfileRepository;
import com.tennismatch.backend.utils.ApiErrors;
import com.tennismatch.backend.utils.AuthUserIdResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.apache.commons.lang3.StringUtils.firstNonBlank;


@RestController
@RequestMapping("/me")
@RequiredArgsConstructor
public class DeckController {

    private final DeckService deckService;
    private final DeckSessionService deckSessionService;
    private final DecisionService decisionService;
    private final DeckCandidateFilter deckCandidateFilter;
    private final PhotoRepository photoRepo;
    private final UserProfileRepository userProfileRepository;
    private final AuthUserIdResolver idResolver;

    private static final int DEFAULT_SIZE = 20;
    private static final Duration DECK_TTL = Duration.ofMinutes(15);
    private static final String DEFAULT_AVATAR_URL = "/placeholder-man-image.png";

    @GetMapping(value = "/deck", produces = "application/json")
    public ResponseEntity<GetDeckResponse> getDeck(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        Long actorId = idResolver.resolveUserId(auth);

        List<DeckCandidateDto> candidates = deckService.getDeck(actorId, DEFAULT_SIZE);
        DeckCandidateFilter.DeckFilterResult filtered = deckCandidateFilter.filter(actorId, candidates);
        List<DeckCandidateDto> filteredCandidates = filtered.candidates();

        List<Long> candidateIds = filteredCandidates.stream()
                .map(DeckCandidateDto::getUserId)
                .filter(id -> id != null)
                .toList();

        Map<Long, UserProfile> byId = candidateIds.isEmpty()
                ? Map.of()
                : userProfileRepository.findAllById(candidateIds).stream()
                        .collect(Collectors.toMap(UserProfile::getId, u -> u));

        Map<Long, String> photos = candidateIds.isEmpty()
                ? Map.of()
                : photoRepo.findPrimaryOrLatestByUserIds(candidateIds.toArray(Long[]::new))
                        .stream()
                        .collect(Collectors.toMap(PhotoRepository.UserPhotoRow::getUserId,
                                PhotoRepository.UserPhotoRow::getUrl));

        Map<String, Long> cardToUser = new LinkedHashMap<>();
        List<GetDeckResponse.Card> cards = new ArrayList<>(filteredCandidates.size());
        for (DeckCandidateDto candidate : filteredCandidates) {
            Long targetId = candidate.getUserId();
            if (targetId == null) continue;
            UserProfile u = byId.get(targetId);
            if (u == null) continue;

            String cardId = UUID.randomUUID().toString();
            cardToUser.put(cardId, targetId);

            String photoUrl = photos.get(targetId);
            if (photoUrl == null || photoUrl.isBlank()) {
                photoUrl = DEFAULT_AVATAR_URL;
            }

            cards.add(GetDeckResponse.Card.builder()
                    .id(cardId)
                    .targetId(targetId)
                    .name(u.getName())
                    .age(u.getAge())
                    .skillLevel(u.getSkillLevel().name())
                    .distanceKm(toKmRounded(candidate.getDistanceMeters()))
                    .photo(photoUrl)
                    .bio((u.getDescription() != null && !u.getDescription().isBlank()) ? u.getDescription() : null)
                    .build());
        }

        String token = deckSessionService.create(actorId, cardToUser, Instant.now().plus(DECK_TTL));

        return ResponseEntity.ok(GetDeckResponse.builder()
                .deckToken(token)
                .cards(cards)
                .ttlMs(DECK_TTL.toMillis())
                .build());
    }

    @PostMapping(value = "/decision", consumes = "application/json")
    public ResponseEntity<PostDecisionResponse> postDecision(
            Authentication auth,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKeyHeader,
            @Valid @RequestBody PostDecisionRequest req
    ) {
        if (auth == null) return ResponseEntity.status(401).build();
        Long actorId = idResolver.resolveUserId(auth);   // <— fix

        var session = deckSessionService.get(req.getDeckToken())
                .orElseThrow(() -> ApiErrors.gone("Deck token expired or not found"));
        if (!session.actorId().equals(actorId)) throw ApiErrors.forbidden("Deck token belongs to another user");
        if (session.expiresAt().isBefore(Instant.now())) throw ApiErrors.gone("Deck token expired");

        List<PostDecisionResponse.DecisionResult> results = new ArrayList<>();
        for (var it : req.getItems()) {
            String cardId = it.getCandidateId();
            Long targetUserId = session.cardToUser().get(cardId);
            if (targetUserId == null) throw ApiErrors.badRequest("candidate_id not in current deck");

            Instant at = it.getAt() != null ? it.getAt() : Instant.now();
            String idem = firstNonBlank(it.getIdempotencyKey(), idempotencyKeyHeader);

            DecisionOutcome outcome = decisionService.applyDecision(
                    actorId,
                    targetUserId,
                    it.getDecision().name(),
                    at,
                    idem,
                    it.getPosition()
            );

            PostDecisionResponse.MatchSummary matchSummary = null;
            if (outcome.matched()) {
                UserProfile target = userProfileRepository.findById(targetUserId).orElse(null);
                String photoUrl = null;
                var rows = photoRepo.findPrimaryOrLatestByUserIds(new Long[]{targetUserId});
                if (!rows.isEmpty()) {
                    photoUrl = rows.get(0).getUrl();
                }

                matchSummary = PostDecisionResponse.MatchSummary.builder()
                        .matchId(outcome.matchId())
                        .conversationId(outcome.conversationId())
                        .name(target != null ? target.getName() : null)
                        .age(target != null ? target.getAge() : null)
                        .photoUrl(photoUrl)
                        .build();
            }

            results.add(PostDecisionResponse.DecisionResult.builder()
                    .candidateId(cardId)
                    .targetUserId(targetUserId)
                    .matched(outcome.matched())
                    .match(matchSummary)
                    .build());
        }
        return ResponseEntity.ok(PostDecisionResponse.builder().results(results).build());
    }

    private static Double toKmRounded(Double meters) {
        if (meters == null || meters.isNaN()) return null;
        double km = meters / 1000.0;
        return Math.round(km * 10.0) / 10.0;
    }

}



