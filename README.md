# Vacation Management App

A full-stack vacation request management system built for the Travel Factory internship assignment.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 (Composition API), Vite, Pinia, Vue Router, Axios, Tailwind CSS |
| Backend | Node.js 20, TypeScript, commoneventframework (`--local` mode) |
| ORM | TypeORM |
| Database | PostgreSQL 15 |
| Auth | JWT + bcrypt |
| Testing | Jest (backend), Vitest + Vue Test Utils (frontend) |
| Monorepo | npm workspaces |
| Git Hooks | Husky + lint-staged |

---

## Prerequisites

- Node.js 20+
- Docker + Docker Compose
- npm 9+

---

## Installation

```bash
# 1. Clone the repo
git clone <repo-url>
cd travelfactory-assignment

# 2. Install all dependencies (root + both packages)
npm install
```

---

## Database Setup

```bash
# Start PostgreSQL
docker-compose up -d

# Copy environment file
cp .env.example .env
# Edit .env if you need custom DB credentials (defaults work out of the box)

# Run migrations
cd packages/backend
npm run migrate

# Seed demo users
npm run seed
```

### Demo Users

| Email | Password | Role |
|-------|----------|------|
| alice@example.com | password123 | Requester |
| bob@example.com | password123 | Requester |
| carol@example.com | password123 | Validator |

---

## Running Locally

Open **two terminals**:

```bash
# Terminal 1 — Backend (port 8888)
cd packages/backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd packages/frontend
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## Running Tests

### Unit tests (no DB required)

```bash
# All unit tests (from root — runs both packages)
npm test

# Backend unit tests only (33 tests)
cd packages/backend && npm test

# Frontend unit tests only (33 tests)
cd packages/frontend && npm test
```

### Integration tests (requires PostgreSQL)

Integration tests call the full CEF handler stack against a real `travelfactory_test` database.

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Create the test database (first time only)
docker exec travelfactory_postgres psql -U tfuser -d postgres \
  -c "CREATE DATABASE travelfactory_test OWNER tfuser;"

# 3. Run integration tests (18 tests)
cd packages/backend && npm run test:integration

# Or from root
npm run test:integration
```

### All tests

```bash
# From root: unit + integration (integration needs Docker)
npm test && npm run test:integration
```

### Coverage

```bash
# Backend coverage report
cd packages/backend && npm run test:coverage

# Frontend coverage report
cd packages/frontend && npm run test:coverage
```

---

## Architecture

### Monorepo

```
packages/
  backend/   — Node.js API server
  frontend/  — Vue 3 SPA
```

### Command / Event Pattern

The backend uses a visible command/event architecture:

```
HTTP Request (commoneventframework)
    ↓
CEF Handler (thin HTTP layer)
    ↓  creates
Command (e.g. CreateVacationRequestCommand)
    ↓  dispatched via
CommandBus
    ↓  handled by
CommandHandler (business rules, DB write)
    ↓  emits
Event (e.g. VacationRequestCreatedEvent)
    ↓  consumed by
EventHandlers (logging, future: notifications)
```

- **Commands** are in `packages/backend/src/commands/`
- **Events** are in `packages/backend/src/events/`
- **CommandBus** and **EventBus** are in `packages/backend/src/infrastructure/`

### commoneventframework

[commoneventframework](https://www.npmjs.com/package/commoneventframework) is Travel Factory's Lambda routing library. Routes are declared in `src/root.yaml` (OpenAPI + `x-handler` fields). In development, the `--local` flag starts a local HTTP server on port 8888, simulating API Gateway.

### Authentication

JWT-based auth. The `/auth/login` endpoint issues a signed token. All protected endpoints extract the token from `Authorization: Bearer <token>` and verify it via the `requireAuth` middleware. Role-based access control is enforced in the input parsers before command dispatch.

---

## API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | Public | Authenticate, returns JWT |
| GET | `/vacation-requests` | Any | Own requests (Requester) / all (Validator) |
| POST | `/vacation-requests` | Requester | Submit a new request |
| PATCH | `/vacation-requests/:id/approve` | Validator | Approve a request |
| PATCH | `/vacation-requests/:id/reject` | Validator | Reject with a comment |

Query params for `GET /vacation-requests` (Validator): `?status=&userId=&page=&limit=`

---

## Business Rules

1. End date must be strictly after start date
2. No overlapping vacation requests for the same user
3. Approved requests cannot be modified
4. Start date cannot be in the past
5. Rejection requires a non-empty comment
6. Only Validators can approve or reject

---

## Git Hooks

- **pre-commit**: runs `lint-staged` (ESLint + Prettier on staged files)
- **pre-push**: runs the full test suite — push is blocked if any test fails

---

## Technical Decisions

**npm workspaces** — simplest monorepo setup with no extra tooling overhead.

**commoneventframework local mode** — the `--local` flag turns the Lambda handler into a standard HTTP server for local development, no AWS setup needed.

**Custom EventBus** — wraps Node.js's built-in `EventEmitter`, keeping the architecture visible and dependency-free. Events are named by class (`event.constructor.name`), making the event catalog self-documenting.

**TypeORM with migrations** — schema is versioned and reproducible. The `synchronize: false` setting ensures no accidental schema drift in production.

**Pinia** — the official Vue 3 state management solution, simpler than Vuex with full TypeScript support.

---

## Known Limitations

- No email notifications (event handlers log to console only)
- Transitive vulnerability warnings in `commoneventframework` and Jest dependencies — these come from the package's own deps and do not affect runtime security in this local dev context
- No refresh token mechanism — JWT tokens expire after 8 hours
- No file upload / attachment support for vacation requests
- Frontend does not handle token expiry gracefully (redirects to login on 401 but no silent refresh)
