CREATE TABLE notification_digest_state (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    last_sent_at TIMESTAMPTZ,
    last_window_start TIMESTAMPTZ,
    last_window_end TIMESTAMPTZ,
    meta TEXT
);

ALTER TABLE notification_digest_state
    ADD CONSTRAINT uk_notification_digest_state_user_type UNIQUE (user_id, type);

CREATE INDEX idx_notification_digest_state_type_last_sent
    ON notification_digest_state (type, last_sent_at);

CREATE INDEX idx_notification_digest_state_user_id
    ON notification_digest_state (user_id);
