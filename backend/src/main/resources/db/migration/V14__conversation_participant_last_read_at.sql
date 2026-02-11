ALTER TABLE conversation_participant
    ADD COLUMN last_read_at TIMESTAMPTZ;

CREATE INDEX idx_conversation_participant_user_last_read
    ON conversation_participant (user_id, last_read_at);
