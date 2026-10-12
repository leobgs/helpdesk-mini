# HelpDesk Mini

A minimal, secure, and real-time customer support platform built with **FastAPI** and **Next.js 16**, featuring role-based access control (RBAC), multi-tenancy business support, live messaging via WebSocket, and server-side search & pagination.

---

## Live Deployment & Links

| Service                   | Environment / URL                                                            | Description                     |
| :------------------------ | :--------------------------------------------------------------------------- | :------------------------------ |
| **Frontend (Vercel)**     | [https://helpdesk-mini-two.vercel.app](https://helpdesk-mini-two.vercel.app) | Production Web App              |
| **Frontend (Docker VPS)** | `http://103.189.234.83:3001`                                                 | Self-hosted Frontend Container  |
| **Backend API**           | `http://103.189.234.83:8000`                                                 | FastAPI REST & WebSocket Server |
| **Interactive API Docs**  | [http://103.189.234.83:8000/docs](http://103.189.234.83:8000/docs)           | Swagger UI Documentation        |

---

## Demo Accounts

All demo accounts share the default password: **`password123`**

### Business 1: Tech Corp (`tech-corp`)

| Role           | Email                    | Password      | Permissions                                                   |
| :------------- | :----------------------- | :------------ | :------------------------------------------------------------ |
| **Admin**      | `admin@techcorp.com`     | `password123` | Full access, user management, assign agents, view all tickets |
| **Agent**      | `agent@techcorp.com`     | `password123` | Handle assigned tickets, update ticket status, real-time chat |
| **Customer 1** | `customer1@techcorp.com` | `password123` | Create support tickets, view own tickets, live chat           |
| **Customer 2** | `customer2@techcorp.com` | `password123` | Separate customer account for testing multi-user chat         |

### Business 2: Bio Labs (`bio-labs`)

| Role           | Email                   | Password      | Permissions             |
| :------------- | :---------------------- | :------------ | :---------------------- |
| **Admin**      | `admin@biolabs.com`     | `password123` | Isolated business admin |
| **Agent**      | `agent@biolabs.com`     | `password123` | Isolated business agent |
| **Customer 1** | `customer1@biolabs.com` | `password123` | Customer in Bio Labs    |
| **Customer 2** | `customer2@biolabs.com` | `password123` | Customer in Bio Labs    |

---

## Key Features

- **Authentication & RBAC:** JWT authentication with access and refresh tokens. Role-based access control protecting endpoints and pages (`admin`, `agent`, `customer`).
- **Multi-Tenancy:** Data isolation per business/tenant (`Tech Corp`, `Bio Labs`).
- **Ticket Lifecycle Management:** Create, categorize, prioritize, and track ticket status (`open`, `in_progress`, `resolved`, `closed`).
- **Real-Time Live Chat:** Two-way real-time messaging powered by WebSockets (`/ws/tickets/{id}`).
- **Server-side Search & Pagination:** Debounced text search with configurable page limits (`5`, `10`, `25`, `50`) for both tickets and user management.
- **Full Dockerization:** Production-ready multi-stage Docker build for Next.js (`standalone` output) and FastAPI backend orchestrated with Docker Compose.

---

## Tech Stack & Architecture

### Frontend

- **Framework:** Next.js 16 (App Router, Standalone output)
- **UI & Styling:** React 19, TailwindCSS, Radix UI primitives, Lucide Icons, Sonner toasts
- **State & Data Fetching:** TanStack React Query v5, Axios with automatic token refresh interceptor

### Backend

- **Framework:** FastAPI (Python 3.11)
- **ORM & Database:** SQLAlchemy, SQLite (default) / PostgreSQL support
- **Data Validation:** Pydantic v2
- **Security:** Passlib (Bcrypt hashing), PyJWT
- **Real-time:** Native FastAPI WebSockets

### Architecture

Vertical feature-based layered architecture:

```text
Router (Presentation) ──> Service (Business Logic) ──> Repository (Data Access) ──> Schemas / Models
```

---

## Quick Start with Docker (Recommended)

Run both the frontend and backend with a single command:

```bash
# 1. Clone the repository
git clone https://github.com/leobgs/helpdesk-mini.git
cd helpdesk-mini

# 2. Build and run containers
docker compose up -d --build

# 3. (First time setup) Seed demo database
docker compose exec backend python seed.py
```

- **Frontend:** [http://localhost:3001](http://localhost:3001) (or `http://localhost:3000`)
- **Backend API & Swagger:** [http://localhost:8000/docs](http://localhost:8000/docs)

To stop the containers:

```bash
docker compose down
```

---

## Manual Local Development

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env

# Seed initial database
python seed.py

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run at `http://localhost:8000` (Swagger UI at `http://localhost:8000/docs`).

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Start Next.js development server
npm run dev
```

Frontend will run at `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable                      | Default Value                       | Description                           |
| :---------------------------- | :---------------------------------- | :------------------------------------ |
| `DATABASE_URL`                | `sqlite:///./helpdesk.db`           | SQLAlchemy database connection string |
| `JWT_SECRET_KEY`              | `your-super-secret-jwt-key`         | Secret key for signing access tokens  |
| `JWT_REFRESH_SECRET_KEY`      | `your-super-secret-refresh-jwt-key` | Secret key for signing refresh tokens |
| `ALGORITHM`                   | `HS256`                             | JWT signing algorithm                 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30`                                | Access token expiration in minutes    |

### Frontend (`frontend/.env`)

| Variable              | Default Value           | Description                                  |
| :-------------------- | :---------------------- | :------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL accessible from browser |

---

## Project Directory Structure

```text
helpdesk-mini/
├── backend/
│   ├── app/
│   │   ├── core/               # Security, pagination helper, websocket manager, config
│   │   ├── db/                 # Database connection & SQLAlchemy models
│   │   └── modules/            # Vertical feature modules
│   │       ├── auth/           # Login, registration, token refresh
│   │       ├── users/          # User management, search & pagination
│   │       └── tickets/        # Ticket CRUD, status flow, chat messages
│   ├── seed.py                 # Initial data seeder script
│   ├── Dockerfile              # Backend Dockerfile
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js App Router (login, tickets, admin)
│   │   ├── components/         # Reusable UI & role guard components
│   │   ├── lib/                # Axios instance & token interceptors
│   │   ├── providers/          # React Query provider with global error toast
│   │   └── types/              # TypeScript DTOs & interfaces
│   ├── Dockerfile              # Multi-stage production Dockerfile
│   ├── .dockerignore           # Build context exclusions
│   └── package.json
└── docker-compose.yaml         # Compose file for frontend & backend services
```

---

## Testing Credentials Flow

1. Buka [Frontend](https://helpdesk-mini-two.vercel.app) atau [Local Frontend](http://localhost:3000).
2. Login sebagai **Customer** (`customer1@techcorp.com` / `password123`):
   - Buat tiket baru melalui tombol **Create Ticket**.
   - Kirim pesan ke agent.
3. Logout, lalu login sebagai **Agent** (`agent@techcorp.com` / `password123`):
   - Buka tiket yang baru dibuat, balas pesan customer (real-time chat).
   - Ubah status tiket menjadi `In Progress` atau `Resolved`.
4. Logout, lalu login sebagai **Admin** (`admin@techcorp.com` / `password123`):
   - Masuk ke menu **Manage Users** di navbar untuk melihat daftar user dengan pagination, filter role, dan pencarian.
   - Tambah user baru (Agent atau Customer).
