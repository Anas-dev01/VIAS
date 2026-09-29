# Vehicle Identification and Authentication System (VIAS)

VIAS is a campus gate-control application for registering vehicles, authenticating them by plate number, recording entry and exit activity, and managing access officers. It uses a React frontend, a small Node.js API, and MySQL/MariaDB for persistent data.

## Features

- Role-based access for administrators and security officers
- Vehicle registration, editing, status changes, blacklisting, and image uploads
- Gate authentication with automatic grant/deny decisions
- Entry and exit logs with search and filters
- Dashboard metrics, printable reports, and CSV export
- MySQL-backed users, vehicles, logs, and sessions

## Tech stack

- React, TypeScript, TanStack Start/Router, and Vite
- Tailwind CSS, Radix UI, and Lucide icons
- Node.js HTTP API with `mysql2`
- MySQL or MariaDB (XAMPP is supported for local development)
- Bun package manager

## Prerequisites

- [Bun](https://bun.sh/) (current stable release)
- Node.js 18+ (used by the API script)
- MySQL/MariaDB 8+; XAMPP is suitable for local development

## Getting started

1. Install dependencies:

   ```bash
   bun install
   ```

2. Start MySQL, then import the schema in [`database/schema.sql`](database/schema.sql). For example:

   ```bash
   mysql -u root -p < database/schema.sql
   ```

   Alternatively, import the file through phpMyAdmin. The schema creates the `campus_access_now` database and all required tables.

3. Start the API in one terminal:

   ```bash
   bun run api
   ```

4. Start the frontend in a second terminal:

   ```bash
   bun run dev
   ```

5. Open the URL printed by Vite (normally `http://localhost:5173`). The Vite server proxies `/api` requests to `http://localhost:3001`.

For the demo account, sign in with `admin` / `admin123`. Change or remove this account before any non-demo use.

## Configuration

The API accepts these environment variables. Values below are its local defaults.

| Variable | Default | Description |
| --- | --- | --- |
| `DB_HOST` | `127.0.0.1` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | Database user |
| `DB_PASSWORD` | _(empty)_ | Database password |
| `DB_NAME` | `campus_access_now` | Database name |
| `VIAS_API_PORT` | `3001` | API server port |

Example:

```bash
DB_USER=vias DB_PASSWORD=change-me DB_NAME=campus_access_now bun run api
```

## Roles and access

| Capability | Admin | Officer |
| --- | :---: | :---: |
| View dashboard, vehicles, logs, and reports | Yes | Yes |
| Authenticate vehicles at the gate | Yes | Yes |
| Register, edit, delete, or blacklist vehicles | Yes | No |
| Create or delete officer/admin accounts | Yes | No |

An authentication attempt is granted only when the vehicle is authorized, not blacklisted, and within its validity period. Every attempt is saved to the activity log.

## Available commands

```bash
bun run api       # Start the MySQL-backed API on port 3001
bun run dev       # Start the Vite development server
bun run build     # Create a production build
bun run preview   # Preview the production build
bun run lint      # Run ESLint
bun run format    # Format source files with Prettier
```

To check the API script syntax directly:

```bash
node --check scripts/vias-api.mjs
```

## Project structure

```text
database/schema.sql       Database schema and demo administrator
scripts/vias-api.mjs      Node.js HTTP API and MySQL integration
src/routes/               Application pages and route handlers
src/components/vias/      VIAS-specific UI and route protection
src/lib/vias-auth.tsx     Client authentication provider
src/lib/vias-store.ts     Typed frontend API client
```

## API overview

All routes are served under `/api`.

- Authentication: `POST /login`, `POST /logout`, `GET /session`, `GET /health`
- Users: `GET /users`, `POST /users`, `DELETE /users/:id`
- Vehicles: `GET`, `POST /vehicles`; `GET`, `PUT`, `PATCH`, `DELETE /vehicles/:plate`
- Logs: `GET /logs`, `POST /logs`

The API uses an HTTP-only `vias_session` cookie with a seven-day lifetime. Detailed project and endpoint notes are available in [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md).

## Security note

This project is intended for local development and demonstrations. Passwords are currently stored as plain text, uploaded vehicle images are stored as Base64 in the database, and the local session cookie is not marked `Secure`. Before deploying, add password hashing, HTTPS, stronger validation and authorization checks, secure cookie settings, audit logging, and a production-ready image-storage strategy.
