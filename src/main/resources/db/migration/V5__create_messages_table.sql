CREATE TABLE messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id     UUID        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    sender_id   UUID        REFERENCES users(id) ON DELETE SET NULL,
    content     TEXT        NOT NULL,
    type        VARCHAR(10) NOT NULL DEFAULT 'TEXT' CHECK (type IN ('TEXT', 'IMAGE', 'FILE', 'SYSTEM')),
    reply_to_id UUID        REFERENCES messages(id) ON DELETE SET NULL,
    is_deleted  BOOLEAN     NOT NULL DEFAULT false,
    deleted_at  TIMESTAMP,
    edited_at   TIMESTAMP,
    created_at  TIMESTAMP   NOT NULL DEFAULT now(),
    version     BIGINT      NOT NULL DEFAULT 0
);