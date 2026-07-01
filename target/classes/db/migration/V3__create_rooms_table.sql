CREATE TABLE rooms (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100),
    description TEXT,
    type        VARCHAR(10)  NOT NULL CHECK (type IN ('DIRECT', 'GROUP')),
    created_by  UUID         NOT NULL REFERENCES users(id),
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now(),
    version     BIGINT       NOT NULL DEFAULT 0
);