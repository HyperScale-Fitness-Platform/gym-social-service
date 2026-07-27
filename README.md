# Gym Social Service

This repository contains a Node.js/Express backend for a gym-oriented social platform. The service supports:

- social threads and comments
- private user-to-user chat
- real-time messaging with Socket.IO
- PostgreSQL persistence for feed and chat data
- placeholder event-driven folders for future Kafka-based integrations

The service is intended to be used as a backend component for a larger platform, where the next major enhancement will be the notification system.

---

## 1. What is in this repo?

### Main entry point
- `src/index.js`  
  Starts the Express app, registers routes, exposes the health endpoint, and initializes Socket.IO.

### Routing
- `src/routes/social.routes.js`  
  Handles thread and comment APIs.
- `src/routes/chat.routes.js`  
  Handles the conversation history API.

### Controllers
- `src/controllers/social.controller.js`  
  Implements thread and comment business logic.
- `src/controllers/chat.controller.js`  
  Implements the chat conversation endpoint.

### Models and services
- `src/models/social.model.js`  
  PostgreSQL queries for threads and comments.
- `src/models/message.model.js`  
  PostgreSQL queries for chat messages.
- `src/services/chat.service.js`  
  Core chat service logic.

### Configuration
- `src/config/database.js`  
  Creates the PostgreSQL connection pool.
- `src/config/socket.js`  
  Initializes Socket.IO for real-time chat.
- `src/config/kafka.js`  
  Placeholder for Kafka configuration.

### Events
- `src/events/producers/sessionBooked.producer.js`  
  Placeholder for producing events.
- `src/events/consumers/paymentSucceeded.consumer.js`  
  Placeholder for consuming events.

### Middleware
- `src/middleware/auth.middleware.js`  
  Simple request-auth middleware that reads headers such as `user-id`, `role`, and `email`.

---

## 2. Tech stack

- Node.js 18+
- Express
- PostgreSQL
- Socket.IO
- pg (PostgreSQL client)
- Docker (recommended for local Postgres)

---

## 3. Prerequisites

Make sure you have the following installed:

- Node.js and npm
- Docker Desktop or Docker Engine
- Optional: `psql` client for direct database inspection

---

## 4. Environment variables

Create a `.env` file in the project root with the following values:

```env
PORT=4003
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=devpass
DB_NAME=gym_social
```

The app uses these values to connect to PostgreSQL through the connection pool in `src/config/database.js`.

---

## 5. Install dependencies

Run:

```bash
npm install
```

---

## 6. Start PostgreSQL in Docker

The easiest way to run the database locally is with Docker.

### Start a PostgreSQL container

```bash
docker run --name gym-social-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=gym_social \
  -p 5432:5432 \
  -d postgres:16
```

### Verify the container is running

```bash
docker ps
```

If the container already exists and you want a clean restart:

```bash
docker rm -f gym-social-postgres
```

---

## 7. Create the database schema and tables

The app expects these tables to exist in the `gym_social` database.

Run the following SQL inside PostgreSQL to create the required tables and indexes.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_thread FOREIGN KEY (thread_id)
        REFERENCES threads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_thread_id_created ON comments(thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);
```

### Option 1: run SQL with Docker exec

```bash
docker exec -i gym-social-postgres psql -U postgres -d gym_social <<'SQL'
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_thread FOREIGN KEY (thread_id)
        REFERENCES threads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_thread_id_created ON comments(thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);
SQL
```

### Option 2: use psql directly

If you have the `psql` client installed locally:

```bash
psql -h localhost -U postgres -d gym_social
```

Then paste the SQL above.

---

## 8. Run the service

### Development mode

```bash
npm run dev
```

### Production mode

```bash
npm start
```

The service will start on the port defined in `.env` (currently `4003`).

### Health check

```bash
curl http://localhost:4003/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "social-service"
}
```

---

## 9. API overview

The service exposes two main groups of endpoints.

### Social endpoints

Base path: `/social`

- `GET /social/threads`  
  Get all threads with pagination via `limit` and `offset`.
- `GET /social/users/:id/threads`  
  Get threads created by a specific user.
- `POST /social/threads`  
  Create a new thread.
- `GET /social/threads/:id`  
  Get a single thread.
- `PUT /social/threads/:id`  
  Update a thread.
- `DELETE /social/threads/:id`  
  Delete a thread.
- `GET /social/threads/:id/comments`  
  Get comments for a thread.
- `POST /social/threads/:id/comments`  
  Create a comment.
- `PUT /social/threads/:id/comments/:commentId`  
  Update a comment.
- `DELETE /social/threads/:id/comments/:commentId`  
  Delete a comment.
- `DELETE /social/admin/threads/:id`  
  Admin-only thread deletion.

### Chat endpoints

Base path: `/chat`

- `GET /chat/:otherUserId`  
  Get conversation history between the current user and another user.

### Auth headers

The current auth middleware is intentionally simple. Requests should include headers such as:

```bash
-H "user-id: <uuid>" \
-H "role: user" \
-H "email: user@example.com"
```

Example:

```bash
curl -H "user-id: 11111111-2222-3333-4444-555555555555" \
  -H "role: user" \
  -H "email: user@example.com" \
  http://localhost:4003/social/threads
```

---

## 10. Real-time chat

The app also starts a Socket.IO server on the same HTTP server.

Clients can connect and send real-time messages using the `send_message` event. The server:

1. saves the message to PostgreSQL,
2. broadcasts it to the recipient if they are online,
3. echoes it back to the sender’s connected devices.

This is a good foundation for future notification features.

---

## 11. Next steps

The next major step for this repository is to implement the notification part.

Planned work includes:

- creating a `notifications` table in PostgreSQL
- exposing notification endpoints
- emitting notification events when a thread is created, commented on, or when a private message is received
- wiring the existing event folders into a real Kafka or direct-event flow
- optionally integrating Socket.IO notifications so users receive live updates

At the moment, the notification infrastructure is not yet implemented, but the current chat and social modules provide a strong base for it.
