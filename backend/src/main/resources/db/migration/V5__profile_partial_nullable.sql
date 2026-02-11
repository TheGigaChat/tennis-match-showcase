-- Drop NOT NULL where profile fields are filled later:
ALTER TABLE user_profile
    ALTER COLUMN name DROP NOT NULL,
    ALTER COLUMN age DROP NOT NULL,
    ALTER COLUMN gender DROP NOT NULL,
    ALTER COLUMN user_skill_level DROP NOT NULL;

-- Recreate CHECK constraints to allow NULL
ALTER TABLE user_profile DROP CONSTRAINT IF EXISTS chk_user_profile_age;
ALTER TABLE user_profile DROP CONSTRAINT IF EXISTS chk_user_profile_gender;
ALTER TABLE user_profile DROP CONSTRAINT IF EXISTS chk_user_profile_utr;

ALTER TABLE user_profile
    ADD CONSTRAINT chk_user_profile_age
        CHECK (age IS NULL OR (age BETWEEN 12 AND 99)),
    ADD CONSTRAINT chk_user_profile_gender
        CHECK (gender IS NULL OR gender IN ('MALE','FEMALE')),
    ADD CONSTRAINT chk_user_profile_utr
        CHECK (user_skill_level IS NULL OR user_skill_level IN ('BEGINNER','INTERMEDIATE','UPPER_INTERMEDIATE','COLLEGE_PLAYER','PRO'));

