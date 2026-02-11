package com.tennismatch.backend.repositories;

import com.tennismatch.backend.domain.entries.Photo;
import com.tennismatch.backend.domain.entries.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PhotoRepository extends JpaRepository<Photo, Long> {
    Optional<Photo> findByUser(UserProfile user);
    void deleteByUser(UserProfile user);

    interface UserPhotoRow {
        Long getUserId();
        String getUrl();
    }

    @Query(value = """
        select distinct on (p.user_id)
               p.user_id as userId,
               p.url     as url
          from photo p
         where p.user_id = any(:ids)
        """, nativeQuery = true)
    List<UserPhotoRow> findPrimaryOrLatestByUserIds(@Param("ids") Long[] ids);
}
