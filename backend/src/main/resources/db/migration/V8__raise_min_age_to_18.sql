ALTER TABLE user_profile
    DROP CONSTRAINT IF EXISTS chk_user_profile_age;

ALTER TABLE user_profile
    ADD CONSTRAINT chk_user_profile_age
        CHECK (age IS NULL OR (age BETWEEN 18 AND 99));
