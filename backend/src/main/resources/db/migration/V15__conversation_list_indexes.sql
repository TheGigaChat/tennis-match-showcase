-- Add indexes to support conversation list and message fetch queries
CREATE INDEX IF NOT EXISTS idx_message_conversation_created_at
    ON message (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_participant_user
    ON conversation_participant (user_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participant_conversation
    ON conversation_participant (conversation_id, user_id);
