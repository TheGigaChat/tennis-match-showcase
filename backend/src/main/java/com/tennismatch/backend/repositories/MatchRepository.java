package com.tennismatch.backend.repositories;

import com.tennismatch.backend.domain.entries.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;


public interface MatchRepository extends JpaRepository<Match, Long> {
    boolean existsByUser1IdAndUser2Id(Long u1, Long u2);
    Optional<Match> findByUser1IdAndUser2Id(Long u1, Long u2);

    @Query("""
        select count(m)
          from Match m
         where m.createdAt >= :since
           and (m.user1Id = :userId or m.user2Id = :userId)
    """)
    long countNewMatchesForUserSince(@Param("userId") Long userId,
                                     @Param("since") Instant since);
}
