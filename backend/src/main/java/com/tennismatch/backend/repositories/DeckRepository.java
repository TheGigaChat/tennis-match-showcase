package com.tennismatch.backend.repositories;

import com.tennismatch.backend.domain.entries.UserProfile;
import com.tennismatch.backend.repositories.utils.CandidateRow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DeckRepository extends JpaRepository<UserProfile, Long> {

    @Query(value = """
    WITH a AS (
        SELECT
            up.id,
            ul.location,
            up.user_skill_level       AS skill,
            up.gender                 AS gender,
            p.game                    AS game,
            p.partner_gender          AS partner_gender,
            p.session_type            AS session_type,
            p.max_distance_km         AS max_km
        FROM tinder.user_profile up
        JOIN tinder.preference    p  ON p.user_id = up.id
        JOIN tinder.user_location ul ON ul.user_id = up.id
        WHERE up.id = :actorId
    ),
    ranks AS (
        SELECT 'BEGINNER'::text AS lvl, 0 AS r UNION ALL
        SELECT 'INTERMEDIATE', 1 UNION ALL
        SELECT 'UPPER_INTERMEDIATE', 2 UNION ALL
        SELECT 'COLLEGE_PLAYER', 3 UNION ALL
        SELECT 'PRO', 4
    ),
    cand AS (
        SELECT
            t.id                                   AS targetId,
            ST_Distance(a.location, ul_t.location) AS distanceM,
            abs(rt.r - ra.r)                       AS skill_dist
        FROM tinder.user_profile t
        JOIN tinder.preference    tp   ON tp.user_id = t.id
        JOIN tinder.user_location ul_t ON ul_t.user_id = t.id
        CROSS JOIN a
        JOIN ranks rt ON rt.lvl = t.user_skill_level::text
        JOIN ranks ra ON ra.lvl = a.skill::text
        WHERE t.id <> a.id
          AND t.visible = TRUE
          AND NOT EXISTS (
              SELECT 1
              FROM tinder.user_action ua
              WHERE ua.actor_id = a.id AND ua.target_id = t.id
          )
    
          -- Actor preferences: candidate gender must fit actor.partner_gender
          AND (
                COALESCE(a.partner_gender::text, 'ANY') = 'ANY'
                OR t.gender::text = a.partner_gender::text
              )
    
          -- Candidate preferences: actor gender must fit tp.partner_gender
          AND (
                COALESCE(tp.partner_gender::text, 'ANY') = 'ANY'
                OR a.gender::text = tp.partner_gender::text
              )
    
          -- Mutual compatibility by "what both are looking for"
          AND tp.game = a.game
          AND tp.session_type = a.session_type
    
          -- Distance: actor constraint
          AND ST_DWithin(ul_t.location, a.location, a.max_km * 1000)
    
          -- Distance: candidate constraint (reciprocal)
          AND ST_DWithin(ul_t.location, a.location, COALESCE(tp.max_distance_km, a.max_km) * 1000)
    
          -- Player level: no hard filter (full range allowed)
    )
    SELECT targetId, distanceM
    FROM cand
    ORDER BY
      CASE WHEN skill_dist = 0 THEN 0 ELSE 1 END,  -- your level first
      distanceM,                                   -- then by distance (within groups)
      targetId
    LIMIT :limit
    """, nativeQuery = true)
        List<CandidateRow> findCandidates(@Param("actorId") Long actorId,
                                          @Param("limit") int limit);
}
