CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    device_info TEXT,
    expires_at  TIMESTAMP    NOT NULL,
    is_revoked  BOOLEAN      NOT NULL DEFAULT false,
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uq_refresh_token_hash UNIQUE (token_hash)
);