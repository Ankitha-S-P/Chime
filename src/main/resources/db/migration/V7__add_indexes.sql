-- Users
CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Refresh tokens
CREATE INDEX idx_refresh_tokens_user_id    ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- Room members
CREATE INDEX idx_room_members_user_id ON room_members(user_id);

-- Messages — most important indexes
CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC);
CREATE INDEX idx_messages_sender_id    ON messages(sender_id);
CREATE INDEX idx_messages_reply_to_id  ON messages(reply_to_id);
CREATE INDEX idx_messages_fts          ON messages USING GIN(to_tsvector('english', content));

-- Audit logs
CREATE INDEX idx_audit_logs_actor_id   ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity_id  ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);