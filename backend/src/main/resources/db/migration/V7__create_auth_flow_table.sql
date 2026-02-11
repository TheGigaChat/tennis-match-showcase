CREATE TABLE IF NOT EXISTS auth_flow (
                                         flow_id VARCHAR(64) PRIMARY KEY,
                                         email TEXT NOT NULL,
                                         code VARCHAR(6) NOT NULL,
                                         attempts INT NOT NULL,
                                         resend_count INT NOT NULL,
                                         resend_cooldown_until TIMESTAMPTZ NOT NULL,
                                         expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_flow_expires_at
    ON auth_flow (expires_at);
