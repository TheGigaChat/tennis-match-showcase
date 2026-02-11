-- match table
CREATE TABLE IF NOT EXISTS match (
                                     id         BIGSERIAL PRIMARY KEY,
                                     user1_id   BIGINT NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
                                     user2_id   BIGINT NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
                                     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Enforce canonical order and pair uniqueness
                                     CONSTRAINT match_sorted_pair CHECK (user1_id < user2_id),
                                     CONSTRAINT uk_match UNIQUE (user1_id, user2_id)
);

-- Indexes for fast "my matches" queries
CREATE INDEX IF NOT EXISTS idx_match_user1 ON match (user1_id);
CREATE INDEX IF NOT EXISTS idx_match_user2 ON match (user2_id);
