ALTER TABLE user_profile
    ADD COLUMN last_active_at TIMESTAMPTZ;

UPDATE user_profile
   SET last_active_at = now()
 WHERE last_active_at IS NULL;

CREATE INDEX idx_user_profile_last_active_at
    ON user_profile (last_active_at);
