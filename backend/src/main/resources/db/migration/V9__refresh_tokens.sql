CREATE TABLE IF NOT EXISTS refresh_token (
                                             id BIGSERIAL PRIMARY KEY,
                                             user_id BIGINT NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
                                             token_hash VARCHAR(64) NOT NULL,
                                             created_at TIMESTAMPTZ NOT NULL,
                                             expires_at TIMESTAMPTZ NOT NULL,
                                             last_used_at TIMESTAMPTZ,
                                             revoked_at TIMESTAMPTZ,
                                             replaced_by_id BIGINT
);

ALTER TABLE refresh_token
    ADD CONSTRAINT fk_refresh_token_replaced_by
        FOREIGN KEY (replaced_by_id) REFERENCES refresh_token(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_refresh_token_hash
    ON refresh_token (token_hash);

CREATE INDEX IF NOT EXISTS idx_refresh_token_user
    ON refresh_token (user_id);

CREATE INDEX IF NOT EXISTS idx_refresh_token_expires_at
    ON refresh_token (expires_at);
