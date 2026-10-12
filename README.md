# HelpDesk Mini

A minimal, secure, and real-time customer support platform built with **FastAPI** and **Next.js 16**, featuring role-based access control (RBAC), multi-tenancy business isolation, persistent real-time chat via WebSocket with HTTP fallback, server-side search & pagination, and multi-database support (PostgreSQL 15 & SQLite).

---

## Live Deployment & Links

| Service                   | Environment / URL                                                            | Deskripsi                       |
| :------------------------ | :--------------------------------------------------------------------------- | :------------------------------ |
| **Frontend (Vercel)**     | [https://helpdesk-mini-two.vercel.app](https://helpdesk-mini-two.vercel.app) | Production Web App              |
| **Frontend (Docker VPS)** | `http://103.189.234.83:3001`                                                 | Self-hosted Frontend Container  |
| **Backend API**           | `http://103.189.234.83:8000`                                                 | FastAPI REST & WebSocket Server |
| **Interactive API Docs**  | [http://103.189.234.83:8000/docs](http://103.189.234.83:8000/docs)           | Swagger UI Documentation        |

---

## Demo Accounts

Semua akun demo menggunakan password default: **`password123`**

### Business 1: Tech Corp (`tech-corp`)

| Role           | Email                    | Password      | Hak Akses & Kemampuan                                         |
| :------------- | :----------------------- | :------------ | :------------------------------------------------------------ |
| **Admin**      | `admin@techcorp.com`     | `password123` | Akses penuh, manajemen user, assign agent, kelola semua tiket |
| **Agent**      | `agent@techcorp.com`     | `password123` | Ambil tiket (*Take Ticket*), update status, live chat 2 arah  |
| **Customer 1** | `customer1@techcorp.com` | `password123` | Buat tiket baru, lihat tiket milik sendiri, live chat         |
| **Customer 2** | `customer2@techcorp.com` | `password123` | Akun customer terpisah untuk simulasi multi-user              |

### Business 2: Bio Labs (`bio-labs`)

| Role           | Email                   | Password      | Hak Akses & Kemampuan          |
| :------------- | :---------------------- | :------------ | :----------------------------- |
| **Admin**      | `admin@biolabs.com`     | `password123` | Admin terisolasi pada Bio Labs |
| **Agent**      | `agent@biolabs.com`     | `password123` | Agent terisolasi pada Bio Labs |
| **Customer 1** | `customer1@biolabs.com` | `password123` | Customer terisolasi Bio Labs   |
| **Customer 2** | `customer2@biolabs.com` | `password123` | Customer terisolasi Bio Labs   |

---

## Fitur-Fitur Utama (Key Features)

### 1. Autentikasi & Role-Based Access Control (RBAC)
- Otentikasi berbasis **JWT** dengan pemisahan *Access Token* (30 menit) dan *Refresh Token* (7 hari).
- Endpoint dan halaman terproteksi berdasarkan role (`admin`, `agent`, `customer`).
- Refresh token otomatis via Axios Interceptor di frontend saat access token kedaluwarsa tanpa perlu login ulang.

### 2. Multi-Tenancy & Data Isolation
- Isolasi data penuh per entitas bisnis/tenant (`Tech Corp` dan `Bio Labs`).
- User dan tiket tidak dapat dilihat atau diakses oleh pengguna dari bisnis lain.

### 3. Manajemen Tiket (Ticket Lifecycle Management)
- Pembuatan tiket dengan subjek, kategori (*Support*, *Billing*, dll.), dan prioritas (*Low*, *Medium*, *High*, *Urgent*).
- Siklus perubahan status tiket: `Open` ➔ `In Progress` ➔ `Resolved` ➔ `Closed`.
- Tombol **Take Ticket** memudahkan agent untuk mengklaim tiket yang berstatus open.
- Tiket yang telah berstatus `Closed` otomatis mengunci input chat.

### 4. Persistent Real-Time Live Chat
- **Bidirectional Streaming via WebSocket:** Koneksi langsung ke `/api/v1/tickets/ws/{id}` untuk pengiriman dan penerimaan pesan seketika.
- **Zero Message Loss (HTTP Fallback):** Jika koneksi WebSocket gagal atau offline, pesan otomatis dikirimkan melalui endpoint REST API `POST /api/v1/tickets/{id}/messages`.
- **Auto-Reconnection & Sinkronisasi:** WebSocket otomatis mencoba menyambung kembali setiap 3 detik jika terputus, dan me-refetch riwayat pesan terbaru dari server setelah berhasil terhubung kembali.
- **Deduplikasi Pesan Handal:** Mengeliminasi masalah gelembung chat duplikat atau status pengiriman macet (*stuck "sending..."*) dengan deduplikasi ID pesan real-time.
- **Real-Time Typing Indicator:** Menampilkan indikator pengetikan pengguna lain secara live dan otomatis hilang setelah jeda pengetikan 2 detik.
- **Real-Time Ticket Status Broadcasting:** Perubahan status tiket (misal dari `In Progress` menjadi `Resolved`) langsung tersiar ke layar customer secara live tanpa reload halaman.
- **Responsif:** Tampilan bubble chat adaptif untuk layar desktop maupun smartphone dengan auto-scroll ke pesan terbaru.

### 5. Server-Side Pagination, Filtering & Search
- **Daftar Tiket (`GET /api/v1/tickets`):** Pencarian teks ter-debounce, filter berdasarkan status dan prioritas, serta paginasi server-side.
- **Manajemen Pengguna (`GET /api/v1/users`):** Pencarian user berdasarkan nama/email, filter berdasarkan role, dan paginasi data.
- **Riwayat Pesan Tiket (`GET /api/v1/tickets/{id}/messages`):** Dukungan pengambilan pesan dengan parameter limit dan offset.

### 6. Fleksibilitas Database (PostgreSQL 15 & SQLite)
- Mendukung **PostgreSQL 15** untuk production dan **SQLite** untuk keperluan development cepat lokal.
- Manajemen skema dan migrasi database terkelola rapi menggunakan **Alembic** (`alembic upgrade head`).
- Script seeding awal (`python seed.py`) untuk inisialisasi data multi-tenant dan demo user secara instan.

### 7. Kontainerisasi Penuh (Docker & Docker Compose)
- Siap dijalankan dengan satu perintah menggunakan `docker compose up -d --build`.
- Multi-stage Dockerfile untuk Next.js dengan output mode `standalone` untuk ukuran image yang ringan dan efisien.
- Menjalankan 3 kontainer terisolasi: `backend` (FastAPI), `frontend` (Next.js), dan `db` (PostgreSQL 15 Alpine).

---

## Tech Stack & Arsitektur

### Frontend
- **Framework:** Next.js 16 (App Router, Standalone build)
- **Library UI:** React 19, TailwindCSS, Radix UI primitives, Lucide React Icons
- **Notifikasi:** Sonner Toasts
- **State & Data Fetching:** TanStack React Query v5, Axios dengan interceptor auto-refresh token
- **Cookies & Storage:** js-cookie

### Backend
- **Framework:** FastAPI (Python 3.11)
- **ORM & Database:** SQLAlchemy 2.0, Alembic migrations, PostgreSQL (`psycopg2-binary`) / SQLite
- **Skema & Validasi:** Pydantic v2 & Pydantic-Settings
- **Keamanan & Hashing:** Passlib (Bcrypt), PyJWT
- **Real-Time Engine:** Native FastAPI WebSockets & in-memory connection manager

### Arsitektur Backend (Vertical Layered Service)
Setiap modul fitur di backend (`auth`, `users`, `tickets`) mengadopsi struktur terpisah secara vertikal sesuai aturan arsitektur:

```text
backend/app/modules/<feature>/
├── router.py      # Presentation Layer (FastAPI endpoints, WebSocket route, request handling)
├── service.py     # Business Logic Layer (validasi bisnis, otorisasi, koordinasi alur data)
├── repository.py  # Data Access Layer (SQLAlchemy queries, filter, pagination, DB commits)
└── schemas.py     # Data Transfer Objects (Pydantic models untuk request & response)
```

---

## Quick Start dengan Docker (Rekomendasi)

Jalankan seluruh stack (Frontend, Backend, dan PostgreSQL) dalam kontainer:

```bash
# 1. Clone repository
git clone https://github.com/leobgs/helpdesk-mini.git
cd helpdesk-mini

# 2. Siapkan file environment backend
cp backend/.env.example backend/.env

# Jika backend berjalan di Docker dan ingin terhubung ke container PostgreSQL:
# Pastikan DATABASE_URL di backend/.env adalah:
# DATABASE_URL=postgresql://user:password@db:5432/helpdesk-mini

# 3. Build dan jalankan seluruh container
docker compose up -d --build

# 4. Jalankan migrasi database di container backend
docker compose exec backend alembic upgrade head

# 5. Jalankan seed data demo
docker compose exec backend python seed.py
```

### Akses Layanan:
- **Frontend App:** [http://localhost:3001](http://localhost:3001)
- **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL Database:** Host `localhost` (atau `db` di dalam Docker network), Port `5432`, User `user`, Password `password`, Database `helpdesk-mini`.

Untuk menghentikan kontainer:
```bash
docker compose down
```

---

## Manual Local Development

### 1. Setup Backend (FastAPI)

```bash
cd backend

# Buat dan aktifkan virtual environment
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Siapkan konfigurasi environment
cp .env.example .env

# Jalankan migrasi skema database
alembic upgrade head

# Seed data awal
python seed.py

# Jalankan backend development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend aktif di `http://localhost:8000` dan dokumentasi OpenAPI di `http://localhost:8000/docs`.

### 2. Setup Frontend (Next.js)

```bash
cd frontend

# Install package dependencies
npm install

# Siapkan konfigurasi environment
cp .env.example .env

# Jalankan Next.js development server
npm run dev
```
Frontend aktif di `http://localhost:3000`.

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable                      | Contoh Nilai (SQLite)       | Contoh Nilai (PostgreSQL)                                                | Deskripsi                                    |
| :---------------------------- | :-------------------------- | :----------------------------------------------------------------------- | :------------------------------------------- |
| `DATABASE_URL`                | `sqlite:///./helpdesk.db`   | `postgresql://user:password@localhost:5432/helpdesk-mini` *(local)*      | Connection string database SQLAlchemy        |
|                               |                             | `postgresql://user:password@db:5432/helpdesk-mini` *(docker)*            | Gunakan host `db` saat di dalam Docker       |
| `JWT_SECRET_KEY`              | `your-super-secret-jwt-key` | `your-super-secret-jwt-key`                                              | Kunci rahasia untuk tanda tangan access token|
| `JWT_REFRESH_SECRET_KEY`      | `your-secret-refresh-key`   | `your-secret-refresh-key`                                                | Kunci rahasia untuk refresh token            |
| `ALGORITHM`                   | `HS256`                     | `HS256`                                                                  | Algoritma hashing JWT                        |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30`                        | `30`                                                                     | Durasi aktif token akses (menit)             |

> **Catatan Karakter Khusus Password:** Jika password database mengandung simbol seperti `@` atau `#`, lakukan URL encoding (misalnya password `lele@123` ditulis menjadi `lele%40123` pada `DATABASE_URL`).

### Frontend (`frontend/.env`)

| Variable              | Nilai Default           | Deskripsi                                             |
| :-------------------- | :---------------------- | :---------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Base URL Backend API yang dapat diakses browser klien |

---

## Panduan Koneksi Database GUI (DBeaver / TablePlus / pgAdmin)

Jika ingin melihat data tabel langsung dari software GUI database:

- **Bila menggunakan SQLite:**
  - Pilih driver **SQLite**.
  - Arahkan path file ke `backend/helpdesk.db`.
- **Bila menggunakan PostgreSQL (Lokal / Docker):**
  - **Host:** `localhost`
  - **Port:** `5432`
  - **Database:** `helpdesk-mini`
  - **Username:** `user` (atau sesuai konfigurasi env)
  - **Password:** `password` (atau sesuai konfigurasi env)

---

## Troubleshooting & FAQ

### 1. Kenapa muncul pesan error "CORS" di browser saat request API?
Seringkali ini adalah *false-positive* dari browser. Ketika backend mengalami kegagalan fatal saat startup (misalnya gagal konek ke database karena password salah atau database mati), FastAPI merespon dengan status `500 Internal Server Error` tanpa menyertakan header CORS lengkap. Cek log backend (`docker compose logs backend` atau terminal uvicorn) untuk melihat error sebenarnya dari database.

### 2. Password PostgreSQL diubah di `docker-compose.yaml` tapi tetap gagal autentikasi?
PostgreSQL resmi Docker hanya menginisialisasi username dan password saat volume pertama kali dibuat. Jika volume `postgres_data` sudah ada, PostgreSQL mengabaikan env var baru tersebut. Untuk mereset:
```bash
docker compose down -v
docker compose up -d --build
```
*(Perhatian: `down -v` akan menghapus data kontainer sebelumnya, jalankan `alembic upgrade head` dan `seed.py` kembali).*

### 3. Mengapa pesan chat sebelumnya sempat muncul dobel dan berstatus "sending..."?
Masalah tersebut telah teratasi. Sebelumnya frontend menggunakan *optimistic temporary negative ID* yang tersimpan di cache TanStack Query dan bertabrakan dengan ID asli dari server. Sekarang pengiriman telah disederhanakan dengan fungsi deduplikasi ID pesan murni dan fallback REST langsung jika WebSocket terputus.

---

## Struktur Direktori Proyek

```text
helpdesk-mini/
├── backend/
│   ├── alembic/                # Skrip migrasi database Alembic
│   │   ├── versions/           # File revisi migrasi schema tabel
│   │   └── env.py              # Konfigurasi metadata migrasi SQLAlchemy
│   ├── app/
│   │   ├── core/               # Konfigurasi, helper pagination, websocket connection manager
│   │   ├── db/                 # Setup database session & definisi model SQLAlchemy
│   │   └── modules/            # Vertical feature modules
│   │       ├── auth/           # Login, register, refresh token, otentikasi DTO
│   │       ├── users/          # Manajemen data pengguna, pencarian & paginasi
│   │       └── tickets/        # Tiket CRUD, status transition, pesan chat (WebSocket + REST)
│   ├── seed.py                 # Skrip seeder data multi-tenant dan demo user
│   ├── Dockerfile              # Dockerfile backend FastAPI
│   └── requirements.txt        # Dependensi Python
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js App Router (login, tickets, tickets/[id], admin/users)
│   │   ├── components/         # Komponen reusable UI & role guard
│   │   ├── contexts/           # AuthContext & state pengguna
│   │   ├── lib/                # Konfigurasi Axios client & request interceptors
│   │   ├── providers/          # React Query Provider
│   │   └── types/              # Deklarasi TypeScript types & DTOs
│   ├── Dockerfile              # Dockerfile multi-stage Next.js standalone
│   ├── .dockerignore           # Pengecualian build context Docker
│   └── package.json            # Dependensi Node.js / NPM
└── docker-compose.yaml         # Orkestrasi 3 service: backend, frontend, & postgresql
```

---

## Alur Pengujian Fitur (Testing Walkthrough)

1. Buka [Frontend](https://helpdesk-mini-two.vercel.app) atau [Local Frontend](http://localhost:3000 / http://localhost:3001).
2. **Sebagai Customer** (`customer1@techcorp.com` / `password123`):
   - Klik **Create Ticket** untuk membuat tiket bantuan baru.
   - Buka tiket tersebut, ketikkan pesan obrolan (pesan tersimpan ke database secara persisten dan tersiar live).
3. **Sebagai Agent** (`agent@techcorp.com` / `password123`):
   - Buka browser kedua atau jendela *incognito*.
   - Temukan tiket yang baru dibuat, klik **Take Ticket** untuk menetapkan tiket kepada Anda.
   - Balas pesan customer (chat dua arah terhubung secara real-time).
   - Perhatikan indikator saat customer sedang mengetik.
   - Ubah status tiket menjadi `In Progress` atau `Resolved` (perubahan status langsung diperbarui di layar customer).
4. **Sebagai Admin** (`admin@techcorp.com` / `password123`):
   - Buka menu **Manage Users** di navbar atas.
   - Uji fitur pencarian nama atau email, penyaringan berdasarkan role, dan navigasi paginasi.
   - Tambah akun Agent atau Customer baru.
