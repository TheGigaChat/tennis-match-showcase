CREATE TABLE IF NOT EXISTS onboarding_status (
    user_id BIGINT PRIMARY KEY
        REFERENCES user_profile(id) ON DELETE CASCADE,
    name_completed BOOLEAN NOT NULL DEFAULT FALSE,
    about_completed BOOLEAN NOT NULL DEFAULT FALSE,
    age_completed BOOLEAN NOT NULL DEFAULT FALSE,
    gender_completed BOOLEAN NOT NULL DEFAULT FALSE,
    tennis_level_completed BOOLEAN NOT NULL DEFAULT FALSE,
    profile_photo_completed BOOLEAN NOT NULL DEFAULT FALSE,
    preferences_completed BOOLEAN NOT NULL DEFAULT FALSE,
    location_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO onboarding_status (user_id)
SELECT id FROM user_profile
ON CONFLICT (user_id) DO NOTHING;
