CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID         REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(50)  NOT NULL,
    entity_type VARCHAR(20)  NOT NULL,
    entity_id   UUID         NOT NULL,
    metadata    JSONB,
    created_at  TIMESTAMP    NOT NULL DEFAULT now()
);