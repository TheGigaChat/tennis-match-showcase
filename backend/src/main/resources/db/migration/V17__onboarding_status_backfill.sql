UPDATE onboarding_status os
SET
    name_completed = (up.name IS NOT NULL AND btrim(up.name) <> ''),
    about_completed = (up.description IS NOT NULL AND btrim(up.description) <> ''),
    age_completed = (up.age IS NOT NULL),
    gender_completed = (up.gender IS NOT NULL),
    tennis_level_completed = (up.user_skill_level IS NOT NULL),
    profile_photo_completed = EXISTS (
        SELECT 1 FROM photo p WHERE p.user_id = os.user_id
    ),
    preferences_completed = EXISTS (
        SELECT 1 FROM preference pref WHERE pref.user_id = os.user_id
    ),
    location_completed = EXISTS (
        SELECT 1 FROM user_location ul WHERE ul.user_id = os.user_id
    )
FROM user_profile up
WHERE os.user_id = up.id;
