# RCT Folder Management System

Enterprise folder and document management for the **Rice Council of Tanzania (RCT)**, with role-based access control, audit logging, and production-oriented storage.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, JavaScript, React Router |
| Backend | Node.js, Express.js, JavaScript, REST |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT, bcrypt password hashing |
| Storage | Local (development) or Cloudinary / object storage (production) |
| Hosting | Frontend on Vercel, API on Render |

## Project structure

```
RCT-Folder-Management-System/
├── backend/
│   ├── prisma/                # Schema, migrations, seed
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   └── app.js
│   ├── server.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── layouts/
    │   ├── pages/
    │   ├── routes/
    │   └── services/
    └── vercel.json
```

## Local setup

### Prerequisites

- Node.js 20+
- PostgreSQL 18.x (database `rct_folder_management` already created in this project)

### 1. Backend environment

Copy `backend/.env.example` to `backend/.env` if you are starting fresh.

Required variables:

- `DATABASE_URL` — if the password contains `@`, URL-encode it as `%40`
- `JWT_SECRET` — long random string
- `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` — used only by the seed script
- `FRONTEND_URL` — `http://localhost:5173` locally

Optional: SMTP settings for password-reset emails. If SMTP is not configured, the API logs a development reset URL.

### 2. Install, migrate, seed

```bash
cd backend
npm install
npx prisma validate
npx prisma migrate dev --name init
npx prisma db seed
```

The seed is idempotent. It creates:

- Permissions and roles (`super_admin`, `admin`, `user`)
- Categories: Policy, Gallery, Program, IDH, IRVC
- Matching root folders
- The initial SUPER ADMIN from `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD`

The first admin password is hashed with bcrypt. Change it after first login.

### 3. Run the API

```bash
cd backend
npm run dev
```

Health check: `GET http://localhost:5000/api/health`

### 4. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
```

Open `http://localhost:5173` and sign in with the seeded admin credentials.

## File storage

`STORAGE_PROVIDER` selects the backend:

- `local` — files are stored under `backend/uploads` for development only
- `cloudinary` — production object storage (set Cloudinary credentials)

Do not rely on the Render disk for permanent files. Configure Cloudinary (or extend `backend/src/services/storageService.js` for S3 / Supabase) before production use.

## Security notes

- Passwords are never stored or returned in plaintext
- Deactivated users cannot sign in
- Permissions are enforced on every protected API route
- The primary SUPER ADMIN (`isSuperAdmin`) cannot be deleted, deactivated, or stripped of role
- JWT secrets, database passwords and storage keys must come from environment variables
- Login and password-reset endpoints are rate limited

## Deploy backend to Render

1. Create a Render Web Service from this repository with **Root Directory** `backend`
2. Build: `npm install && npx prisma generate`
3. Start: `npx prisma migrate deploy && npm start`
4. Set environment variables from `backend/.env.example`, using production values:
   - `DATABASE_URL` (Render PostgreSQL or existing hosted Postgres)
   - `JWT_SECRET`
   - `FRONTEND_URL` (your Vercel URL, including `https://`)
   - `STORAGE_PROVIDER=cloudinary` and Cloudinary keys
   - `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` then SSH/shell `npx prisma db seed` once
5. Confirm `GET /api/health` returns success

A sample `render.yaml` is included at the repository root.

## Deploy frontend to Vercel

1. Import the repository in Vercel
2. Set **Root Directory** to `frontend`
3. Framework: Vite
4. Environment variable (Production): `VITE_API_URL=https://<your-render-service>.onrender.com`
5. Deploy

`frontend/vercel.json` rewrites all routes to `index.html` for React Router.

After deploy, add the Vercel origin to backend `FRONTEND_URL`. Multiple origins can be comma-separated.

## Default development admin

Configured in `backend/.env` (change immediately if you use this locally):

- Email: `admin@rct.local`
- Password: `ChangeThisAdmin1`

Do not use these values in production.
