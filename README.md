# Chime — Real-time Chat Application

> A full-stack chat application built with Java Spring Boot and React, featuring real-time messaging, JWT authentication, WebSocket communication, and cloud deployment.

**Live Demo:** [https://chime-app-woad.vercel.app/](https://chime-app-woad.vercel.app/) <!-- replace with your Vercel URL -->

---

## Features

### Messaging
- Real-time message delivery via WebSocket (STOMP protocol)
- Group channels and one-on-one Direct Messages
- Reply to messages (quoted reply, WhatsApp-style)
- Soft-delete messages (own messages, or admin deleting any message)
- Cursor-based pagination for message history (infinite scroll)
- Live typing indicators (`Alice is typing...`)

### Rooms & Members
- Create group channels with a name
- Invite members by username search
- Admin controls — remove members, rename room
- Leave a group
- Online presence indicators (green/grey dot per member)
- Members panel with roles (ADMIN / MEMBER)

### Authentication & Sessions
- Register and login with email + password
- JWT access tokens (short-lived, 15 min)
- Refresh token rotation (long-lived, 7 days, stored hashed in DB)
- Silent token refresh via Axios interceptor — seamless UX
- Logout blacklists the JWT in Redis (instant revocation)
- Passwords hashed with BCrypt

### Security
- Spring Security filter chain with stateless JWT validation
- Redis-backed JWT blacklist (prevents use of logged-out tokens)
- Admin checks enforced in the service layer (`assertAdmin()`) for room operations
- XSS prevention — all user input sanitised with Jsoup before storage
- Sliding-window rate limiting per IP using Redis sorted sets (60 req/min)
- CORS configured globally via `CorsConfig`
- `401 Unauthorized` returned on unauthenticated requests
- Optimistic locking (`@Version`) on `User`, `Room`, and `Message` entities

### Database
- PostgreSQL with Flyway migrations (versioned schema, V1–V7)
- ACID transactions (`@Transactional`) on all write operations
- Refresh token, room membership, and audit log tables
- Cursor-based pagination avoids OFFSET performance degradation
- Indexes on frequently queried columns (`room_id`, `sender_id`, `created_at`)
- Soft deletes for messages (content hidden, record preserved)
- Async audit logging with `@Async` + `Propagation.REQUIRES_NEW`

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Java 21 | Language |
| Spring Boot 4.1.0 | Application framework |
| Spring Security | Authentication & authorization |
| Spring WebSocket + STOMP | Real-time messaging |
| Spring Data JPA + Hibernate | ORM & database access |
| PostgreSQL | Primary relational database |
| Flyway | Database schema migrations |
| Redis (Lettuce) | JWT blacklist, rate limiting, presence |
| JWT (jjwt 0.12.6) | Stateless auth tokens |
| Jsoup | HTML sanitisation (XSS prevention) |
| Lombok | Boilerplate reduction |
| Maven | Build tool |

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Zustand + persist | Global auth state management |
| Axios + interceptors | HTTP client with silent token refresh |
| @stomp/stompjs | STOMP over WebSocket for real-time messages |

### Infrastructure
| Service | Purpose |
|---|---|
| Railway | Backend hosting (Spring Boot JAR) |
| Vercel | Frontend hosting (React SPA) |
| Neon | Managed PostgreSQL (serverless) |
| Upstash | Managed Redis (serverless, TLS via `rediss://`) |
| Docker + Docker Compose | Local development environment |
| Multi-stage Dockerfile | Optimised production image |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser (Vercel)                       │
│   React 19 + TypeScript + Zustand + Axios + @stomp/stompjs  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / WSS
┌────────────────────────▼────────────────────────────────────┐
│                   Spring Boot (Railway)                      │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ REST API    │  │  WebSocket   │  │  Security Filters  │  │
│  │ /api/**     │  │  /ws (STOMP) │  │  JWT + Rate Limit  │  │
│  └──────┬──────┘  └──────┬───────┘  └────────────────────┘  │
│         │                │                                   │
│  ┌──────▼────────────────▼───────────────────────────────┐  │
│  │              Service Layer (Business Logic)            │  │
│  │  AuthService  RoomService  MessageService  Presence    │  │
│  └──────┬────────────────────────────────────────────────┘  │
│         │                                                    │
│  ┌──────▼──────────┐          ┌──────────────────────────┐  │
│  │  PostgreSQL     │          │  Redis                   │  │
│  │  (Neon)         │          │  (Upstash)               │  │
│  │  - users        │          │  - JWT blacklist         │  │
│  │  - rooms        │          │  - Rate limit counters   │  │
│  │  - messages     │          │  - Online presence TTL   │  │
│  │  - room_members │          └──────────────────────────┘  │
│  │  - refresh_tokens│                                        │
│  │  - audit_logs   │                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema
<img width="938" height="880" alt="Screenshot 2026-07-01 at 2 09 19 PM" src="https://github.com/user-attachments/assets/aefe674c-cac6-4ed0-aba3-5c5f3dc24833" />

---

## Local Development Setup

### Prerequisites
- Java 21
- Node.js 18+
- Docker Desktop

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/Chime.git
cd Chime
```

### 2. Start PostgreSQL and Redis
```bash
docker compose up -d
```
This starts:
- PostgreSQL on `localhost:5432` (DB: `chime`, user: `chime_user`)
- Redis on `localhost:6379`

Flyway migrations run automatically on app startup.

### 3. Run the backend
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```
Backend runs on `http://localhost:8080`

### 4. Run the frontend
```bash
cd client
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`

---

## API Overview

### Auth — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create account |
| POST | `/login` | Login, returns access + refresh token |
| POST | `/refresh` | Rotate refresh token, get new access token |
| POST | `/logout` | Blacklist current JWT in Redis |

### Users — `/api/users`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/me` | Get current user profile |
| GET | `/search?query=` | Search users by username |

### Rooms — `/api/rooms`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all rooms the user is a member of |
| POST | `/` | Create a group room |
| GET | `/{id}` | Get a single room |
| PATCH | `/{id}` | Rename room (admin only) |
| POST | `/direct/{userId}` | Get or create a DM with a user |
| GET | `/{id}/members` | List room members with roles |
| POST | `/{id}/members` | Invite a member (admin only) |
| DELETE | `/{id}/members/{userId}` | Remove member or leave room |
| GET | `/{id}/members/online` | Get online member IDs |

### Messages — `/api/rooms/{id}/messages`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Paginated message history (cursor-based) |
| POST | `/` | Send a message |
| DELETE | `/{msgId}` | Soft-delete a message |

### WebSocket — `/ws` (STOMP)

Messages are **sent via REST** and **received via WebSocket**. Typing events go both ways over WebSocket.

| Destination | Direction | Description |
|---|---|---|
| `/topic/room.{roomId}` | Subscribe | Receive incoming messages |
| `/topic/room.{roomId}.typing` | Subscribe | Receive typing events |
| `/app/typing.{roomId}` | Publish | Send a typing event |

---
