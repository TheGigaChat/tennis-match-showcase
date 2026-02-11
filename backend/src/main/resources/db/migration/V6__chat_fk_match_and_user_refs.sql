ALTER TABLE conversation
    ADD CONSTRAINT fk_conversation_match
        FOREIGN KEY (match_id) REFERENCES match(id) ON DELETE CASCADE;

ALTER TABLE conversation_participant
    ADD CONSTRAINT fk_conv_part_user
        FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE;

ALTER TABLE message
    ADD CONSTRAINT fk_message_sender
        FOREIGN KEY (sender_id) REFERENCES user_profile(id) ON DELETE CASCADE;