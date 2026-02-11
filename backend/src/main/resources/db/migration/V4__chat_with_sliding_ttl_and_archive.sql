-- conversations
CREATE TABLE conversation (
                              id               BIGSERIAL PRIMARY KEY,
                              match_id         BIGINT UNIQUE NOT NULL,
                              status           VARCHAR(12)  NOT NULL DEFAULT 'ACTIVE',
                              created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
                              last_message_at  TIMESTAMPTZ,
                              expires_at       TIMESTAMPTZ  NOT NULL,
                              archived_at      TIMESTAMPTZ
);

-- participants (2 rows per chat)
CREATE TABLE conversation_participant (
                                          conversation_id  BIGINT NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
                                          user_id          BIGINT NOT NULL,
                                          PRIMARY KEY (conversation_id, user_id)
);

-- messages
CREATE TABLE message (
                         id               BIGSERIAL PRIMARY KEY,
                         conversation_id  BIGINT NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
                         sender_id        BIGINT NOT NULL,
                         body             TEXT   NOT NULL,
                         created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
                         status           VARCHAR(16)  NOT NULL DEFAULT 'DELIVERED',
                         client_id        VARCHAR(64)  -- for idempotency
);

-- idempotency within a chat
CREATE UNIQUE INDEX ux_message_conv_client
    ON message(conversation_id, client_id)
    WHERE client_id IS NOT NULL;

-- indexes for schedulers/history
CREATE INDEX ix_conversation_expires     ON conversation(expires_at);
CREATE INDEX ix_conversation_status      ON conversation(status);
CREATE INDEX ix_message_conv_created     ON message(conversation_id, created_at DESC);
CREATE INDEX ix_message_conv_id          ON message(conversation_id, id DESC);

-- status validation (minimal)
ALTER TABLE conversation
    ADD CONSTRAINT chk_conversation_status
        CHECK (status IN ('ACTIVE','EXPIRED','ARCHIVED','DELETED'));

ALTER TABLE message
    ADD CONSTRAINT chk_message_status
        CHECK (status IN ('DELIVERED','READ'));
