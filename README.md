# 🌴 Vacation Management App

A full-stack vacation request management system — employees can submit time-off requests, managers can review and act on them, all with a clean interface and a solid backend architecture.

Built for the Travel Factory internship assignment.

---

## 🛠️ Tech Stack

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

## 🚀 Installation & Setup

The only prerequisite is **Docker + Docker Compose**. One command installs everything, sets up the database, runs migrations, seeds demo users, and starts all three services:

```bash
git clone <repo-url>
cd travelfactory-assignment
docker compose up --build
```

Open **http://localhost:5173** in your browser. That's it! 🎉

> On subsequent runs you don't need `--build` — just `docker compose up`.

---

## 👤 Demo Users

| Email | Password | Role |
|-------|----------|------|
| alice@example.com | password123 | Requester |
| bob@example.com | password123 | Requester |
| carol@example.com | password123 | Validator |

---

## 💻 Manual Setup (local dev with hot-reload)

If you prefer to run the services locally — for example to get hot-reload during active development:

**Prerequisites:** Node.js 20+, Docker, npm 9+

```bash
# Install dependencies
npm install

# Start only the database
docker compose up postgres -d

# Run migrations and seed
cd packages/backend && npm run migrate && npm run seed
```

Then open two terminals:

```bash
# Terminal 1 — Backend (port 8888)
cd packages/backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd packages/frontend && npm run dev
```

---

## 🧪 Running Tests

```bash
# Unit tests (no DB required)
npm test

# Integration tests (requires Docker PostgreSQL running)
npm run test:integration

# Coverage reports
cd packages/backend && npm run test:coverage
cd packages/frontend && npm run test:coverage
```

---

## 🏗️ Architecture

### Project Structure

```
packages/
  backend/   — Node.js API (CEF routing, commands, events, TypeORM)
  frontend/  — Vue 3 SPA (Pinia stores, Vue Router, Tailwind)
```

### Command / Event-Driven Architecture

The backend is built around an explicit **command/event pipeline**. Every user action becomes a typed Command that travels through a CommandBus, gets handled by a focused handler, and then emits a Domain Event. This separation keeps business logic, HTTP concerns, and side-effects cleanly decoupled:

```
HTTP Request
    ↓  parsed by CEF input parser
Command  (e.g. CreateVacationRequestCommand)
    ↓  dispatched via CommandBus
CommandHandler  — validates rules, writes to DB
    ↓  publishes
Event  (e.g. VacationRequestCreatedEvent)
    ↓  consumed by
EventBus subscribers  — any number of handlers
```

The **EventBus** is built on Node's native `EventEmitter` and allows any part of the system to **subscribe to domain events without the publisher knowing who is listening**. Today the subscribers log structured events; tomorrow you can add email notifications, Slack alerts, or an audit trail — all by registering a new subscriber, with zero changes to the business logic that publishes the event. This is the key architectural benefit: stakeholders (email service, audit service, analytics) can be added independently and at any time.

Events are named by their class (`event.constructor.name`), making the full event catalog self-documenting and type-safe.

### commoneventframework (CEF)

[commoneventframework](https://www.npmjs.com/package/commoneventframework) is Travel Factory's Lambda routing library. Routes and their handlers are declared in `src/root.yaml` (OpenAPI + `x-handler` extension fields). In development, the `--local` flag starts a local HTTP server on port 8888 that simulates API Gateway — no AWS setup required.

### Authentication

JWT-based. `/auth/login` issues a signed token; all protected routes verify it via `requireAuth` middleware. Role-based access control (Requester / Validator) is enforced in the input parsers before any command is dispatched.

---

## 📡 API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | Public | Authenticate, returns JWT |
| GET | `/vacation-requests` | Any | Own requests (Requester) / all (Validator) |
| POST | `/vacation-requests` | Requester | Submit a new request |
| PATCH | `/vacation-requests/:id/approve` | Validator | Approve a request |
| PATCH | `/vacation-requests/:id/reject` | Validator | Reject with a comment |
| GET | `/vacation-requests/team` | Any | All approved vacations (team planning view) |
| GET | `/users` | Validator | List all requesters (for filter dropdown) |

---

## 📋 Business Rules

1. End date must be strictly after start date
2. Vacation requests cannot overlap for the same user
3. Approved requests cannot be modified
4. Start date cannot be in the past
5. Rejection requires a non-empty comment
6. Only Validators can approve or reject

---

## 🔧 Technical Decisions

**Event-driven architecture** — The Command/Event pattern was chosen to make the system's behaviour explicit and extensible. Publishing a `VacationRequestApprovedEvent` after an approval decouples the core business logic from all downstream concerns. Any new stakeholder (notifications, audit logs, analytics) subscribes to the event independently — the approval handler never needs to change.

**Observability as a first-class concern** — Structured JSON logging (pino) is used throughout with a `requestId` correlation ID on every request. Each command dispatch, event publication, and HTTP response is logged with context (userId, role, duration, status code). This makes the system easy to trace and debug, and forms the foundation for a production monitoring setup.

**commoneventframework local mode** — the `--local` flag turns the Lambda handler into a standard HTTP server for local development, with zero AWS configuration needed. This keeps the development experience identical to the production Lambda deployment.

**TypeORM with migrations** — the schema is versioned and reproducible. `synchronize: false` prevents any accidental schema drift; every schema change goes through an explicit migration file.

**npm workspaces** — the simplest monorepo setup, no extra tooling (Turborepo, Nx) needed at this scale.

**Pinia** — the official Vue 3 state management library. Simpler and more TypeScript-friendly than Vuex.

**Testing strategy** — the project was developed with significant test coverage: 33 backend unit tests (handlers, middleware, infrastructure), 18 integration tests that exercise the full CEF routing stack against a real PostgreSQL test database, and 33 frontend unit tests (components and stores). Git hooks block any push that breaks the test suite.

---

## ⚠️ Known Limitations

- **Event handlers only log** — the event-driven architecture is fully wired, but current subscribers only write structured log entries. Plugging in real notifications (email, Slack) means adding a subscriber — the pipeline is ready.
- **No refresh token** — JWT tokens expire after 8 hours; the frontend redirects to login on 401 but does not silently refresh.
- **No attachment support** — vacation requests support a text reason field only; file uploads are not implemented.
- **Dependency warnings** — transitive vulnerability warnings from `commoneventframework` and Jest deps come from those packages' own dependencies and do not affect runtime security in this local context.
