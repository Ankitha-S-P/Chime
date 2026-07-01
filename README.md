## Database Schema

```mermaid
erDiagram
    ... erDiagram
    users {
        UUID id PK
        VARCHAR email UK
        VARCHAR username UK
        VARCHAR password_hash
        TEXT avatar_url
        BOOLEAN is_active
        TIMESTAMP last_seen_at
        TIMESTAMP created_at
        TIMESTAMP updated_at
        BIGINT version
    }

    refresh_tokens {
        UUID id PK
        UUID user_id FK
        VARCHAR token_hash UK
        TEXT device_info
        TIMESTAMP expires_at
        BOOLEAN is_revoked
        TIMESTAMP created_at
    }

    rooms {
        UUID id PK
        VARCHAR name
        TEXT description
        VARCHAR type
        UUID created_by FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
        BIGINT version
    }

    room_members {
        UUID room_id FK
        UUID user_id FK
        VARCHAR role
        TIMESTAMP last_read_at
        BOOLEAN is_muted
        TIMESTAMP joined_at
    }

    messages {
        UUID id PK
        UUID room_id FK
        UUID sender_id FK
        TEXT content
        VARCHAR type
        UUID reply_to_id FK
        BOOLEAN is_deleted
        TIMESTAMP deleted_at
        TIMESTAMP edited_at
        TIMESTAMP created_at
        BIGINT version
    }

    audit_logs {
        UUID id PK
        UUID actor_id FK
        VARCHAR action
        VARCHAR entity_type
        UUID entity_id
        JSONB metadata
        TIMESTAMP created_at
    }

    users ||--o{ refresh_tokens : "has"
    users ||--o{ room_members : "joins via"
    users ||--o{ messages : "sends"
    users ||--o{ audit_logs : "triggers"
    users ||--o{ rooms : "creates"
    rooms ||--o{ room_members : "has"
    rooms ||--o{ messages : "contains"
    messages |o--o{ messages : "reply_to"

```
