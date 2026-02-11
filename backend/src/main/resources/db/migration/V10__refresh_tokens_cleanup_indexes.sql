CREATE INDEX IF NOT EXISTS idx_refresh_token_revoked_at
    ON refresh_token (revoked_at);
