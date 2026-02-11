-- ====================================================================
-- V2__init_schema.sql — Initial schema (user_profile / user_location / preference / photo / user_action)
-- ====================================================================

-- 0) Schema & Extensions -------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS tinder;
SET search_path = tinder, public;

-- Install PostGIS in public so geography types are available
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

-- 1) user_profile --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profile (
                                            id                 BIGSERIAL PRIMARY KEY,

                                            name               VARCHAR(100)  NOT NULL,
                                            age                INT           NOT NULL,
                                            gender             VARCHAR(16)   NOT NULL,   -- MALE | FEMALE | OTHER
                                            description        TEXT,
                                            user_skill_level   VARCHAR(32)   NOT NULL,   -- BEGINNER | INTERMEDIATE | UPPER_INTERMEDIATE | COLLEGE_PLAYER | PRO
                                            rating             INTEGER,                  -- NULL or 1..5
                                            email              VARCHAR(320)  NOT NULL,
                                            visible            BOOLEAN       NOT NULL DEFAULT TRUE

);

-- Uniqueness (phone/email)
CREATE UNIQUE INDEX IF NOT EXISTS uk_user_profile_email ON user_profile (email);

-- Reference constraints (NOT VALID to avoid blocking data init)
ALTER TABLE user_profile
    ADD CONSTRAINT chk_user_profile_age
        CHECK (age BETWEEN 12 AND 99)
        NOT VALID;

ALTER TABLE user_profile
    ADD CONSTRAINT chk_user_profile_gender
        CHECK (gender IN ('MALE','FEMALE'))
        NOT VALID;

ALTER TABLE user_profile
    ADD CONSTRAINT chk_user_profile_skill
        CHECK (user_skill_level IN ('BEGINNER','INTERMEDIATE','UPPER_INTERMEDIATE','COLLEGE_PLAYER','PRO'))
        NOT VALID;

ALTER TABLE user_profile
    ADD CONSTRAINT chk_user_profile_rating
        CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5))
        NOT VALID;


-- Basic email validation (simplified). ~* is case-insensitive
ALTER TABLE user_profile
    ADD CONSTRAINT chk_user_profile_email_format
        CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
        NOT VALID;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profile_visible           ON user_profile (visible);
CREATE INDEX IF NOT EXISTS idx_user_profile_user_skill_level  ON user_profile (user_skill_level);

-- 2) user_location (new table, 1:1 with user_profile) ------------------------
CREATE TABLE IF NOT EXISTS user_location (
                                             user_id     BIGINT PRIMARY KEY
                                                 REFERENCES user_profile(id) ON DELETE CASCADE,

                                             location    geography(Point,4326) NOT NULL,  -- PostGIS geography point (SRID 4326)
                                             accuracy_m  double precision,                         -- optional (accuracy in meters)
                                             updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes for geography and recency
CREATE INDEX IF NOT EXISTS idx_user_location_geog
    ON user_location USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_user_location_updated_at
    ON user_location (updated_at DESC);

-- 3) preference ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preference (
                                          id               BIGSERIAL PRIMARY KEY,
                                          user_id          BIGINT NOT NULL UNIQUE,     -- 1:1 owner

                                          game             VARCHAR(16)  NOT NULL,      -- TENNIS | PICKLEBALL
                                          partner_gender   VARCHAR(16)  NOT NULL,      -- MALE | FEMALE | ANY
                                          session_type     VARCHAR(16)  NOT NULL,      -- MATCH | PRIVATE
                                          max_distance_km  INT          NOT NULL DEFAULT 20
);

ALTER TABLE preference
    ADD CONSTRAINT chk_pref_game
        CHECK (game IN ('TENNIS','PICKLEBALL'))
        NOT VALID;

ALTER TABLE preference
    ADD CONSTRAINT chk_pref_partner_gender
        CHECK (partner_gender IN ('MALE','FEMALE','ANY'))
        NOT VALID;

ALTER TABLE preference
    ADD CONSTRAINT chk_pref_session_type
        CHECK (session_type IN ('MATCH','PRIVATE'))
        NOT VALID;

ALTER TABLE preference
    ADD CONSTRAINT chk_pref_max_distance
        CHECK (max_distance_km > 0)
        NOT VALID;

ALTER TABLE preference
    ADD CONSTRAINT fk_preference_user
        FOREIGN KEY (user_id) REFERENCES user_profile(id)
            ON DELETE CASCADE;

-- 4) photo --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS photo (
                                     id        BIGSERIAL PRIMARY KEY,
                                     url       VARCHAR(512) NOT NULL,
                                     user_id   BIGINT NOT NULL
);

ALTER TABLE photo
    ADD CONSTRAINT fk_photo_user
        FOREIGN KEY (user_id) REFERENCES user_profile(id)
            ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_photo_user ON photo (user_id);


-- 5) user_action --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_action (
                                           id               BIGSERIAL PRIMARY KEY,
                                           actor_id         BIGINT NOT NULL REFERENCES user_profile(id),
                                           target_id        BIGINT NOT NULL REFERENCES user_profile(id),
                                           decision         VARCHAR(10) NOT NULL,     -- YES | NOPE
                                           at_utc           TIMESTAMPTZ NOT NULL DEFAULT now(),
                                           position         INT,
                                           idempotency_key  VARCHAR(128),

                                           CONSTRAINT no_self_action CHECK (actor_id <> target_id),
                                           CONSTRAINT decision_yes_nope CHECK (decision IN ('YES','NOPE')),
                                           CONSTRAINT uk_user_action_pair UNIQUE (actor_id, target_id),
                                           CONSTRAINT uk_user_action_idem UNIQUE (idempotency_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_action_actor            ON user_action (actor_id);
CREATE INDEX IF NOT EXISTS idx_action_target           ON user_action (target_id);
CREATE INDEX IF NOT EXISTS idx_action_actor_decision   ON user_action (actor_id, decision);
CREATE INDEX IF NOT EXISTS idx_action_target_decision  ON user_action (target_id, decision);

-- Partial index for fast mutual-like checks
CREATE INDEX IF NOT EXISTS idx_action_actor_yes
    ON user_action (actor_id, target_id)
    WHERE decision = 'YES';

-- ====================================================================
-- End
-- ====================================================================
