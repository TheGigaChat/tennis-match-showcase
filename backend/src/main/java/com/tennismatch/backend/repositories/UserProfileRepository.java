package com.tennismatch.backend.repositories;

import com.tennismatch.backend.domain.entries.UserProfile;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.time.Instant;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    @EntityGraph(attributePaths = "preference")
    List<UserProfile> findByIdIn(Collection<Long> ids);

    default List<UserProfile> findAllWithPreferenceByIds(Collection<Long> ids) {
        return findByIdIn(ids);
    }

    Optional<UserProfile> findByEmail(String email);

    @Query("select u.id from UserProfile u where lower(u.email) = lower(:email)")
    Optional<Long> findIdByEmail(@Param("email") String email);

    interface IdNameRow {
        Long getId();
        String getName();
    }

    interface ActiveUserRow {
        Long getId();
        String getEmail();
    }

    @Query("""
      select u.id as id, coalesce(nullif(u.name, ''), 'Player ' || cast(u.id as string)) as name
        from UserProfile u
       where u.id in :ids
    """)
    List<IdNameRow> findNamesByIds(@Param("ids") Collection<Long> ids);

    @Query("""
      select u.id as id, u.email as email
        from UserProfile u
       where u.lastActiveAt >= :cutoff
    """)
    List<ActiveUserRow> findActiveUsersSince(@Param("cutoff") Instant cutoff);

    @Modifying
    @Query("""
        update UserProfile u
           set u.lastActiveAt = :now
         where u.id = :userId
           and (u.lastActiveAt is null or u.lastActiveAt < :threshold)
    """)
    int touchLastActive(@Param("userId") Long userId,
                        @Param("now") Instant now,
                        @Param("threshold") Instant threshold);
}
