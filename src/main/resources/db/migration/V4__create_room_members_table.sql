CREATE TABLE room_members (
    room_id      UUID        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role         VARCHAR(10) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
    last_read_at TIMESTAMP,
    is_muted     BOOLEAN     NOT NULL DEFAULT false,
    joined_at    TIMESTAMP   NOT NULL DEFAULT now(),
    PRIMARY KEY (room_id, user_id)
);