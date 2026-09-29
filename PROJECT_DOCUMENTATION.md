# Vehicle Identification and Authentication System (VIAS)

## 1. Project Overview

The Vehicle Identification and Authentication System (VIAS) is a campus gate control application used to register vehicles, verify vehicle access, manage officers/admins, record gate activity, and generate reports.

The system was originally built with browser storage, but it has been converted to use a normal MySQL database through XAMPP. Vehicle, user, log, session, and vehicle image data are now stored in MySQL instead of `localStorage`.

## 2. Main Objectives

- Register campus vehicles with owner and vehicle details.
- Upload and store a vehicle image during registration.
- Authenticate vehicles at the gate by plate number.
- Automatically grant or deny access based on vehicle status and validity period.
- Log every authentication attempt.
- Manage admins and security officers.
- Generate reports for vehicles, visitors, blacklisted vehicles, expired vehicles, and gate activity.
- Store all persistent data in a MySQL database.

## 3. Technology Stack

- Frontend: React, TypeScript, TanStack Router, TanStack Start, Vite
- Styling: Tailwind CSS, Radix UI components, Lucide icons
- Backend API: Node.js HTTP server
- Database: MySQL/MariaDB through XAMPP
- Database Driver: `mysql2`
- Package Manager: Bun

## 4. Project Structure

```text
database/
  schema.sql              MySQL database and table setup

scripts/
  vias-api.mjs            Node.js API server that connects to MySQL

src/
  lib/
    vias-store.ts         Frontend API wrapper for vehicles, users, logs, and auth
    vias-auth.tsx         Authentication context/provider

  routes/
    login.tsx             Login page
    index.tsx             Dashboard
    authenticate.tsx      Gate vehicle authentication
    vehicles.index.tsx    Vehicle list and status management
    vehicles.new.tsx      Vehicle registration/edit form
    vehicles.$plate.edit.tsx Vehicle edit route
    officers.tsx          Admin/officer management
    logs.tsx              Gate movement logs
    reports.tsx           Reports and CSV export

  components/
    vias/
      AppShell.tsx        Main app layout/sidebar
      RequireAuth.tsx     Route protection
      StatusBadge.tsx     Vehicle status display
```

## 5. User Roles

### Admin

Admins can:

- Register new vehicles.
- Edit existing vehicle records.
- Delete vehicles.
- Blacklist and unblacklist vehicles.
- Manage users/officers.
- View logs.
- Generate reports.
- Authenticate vehicles.

### Officer

Officers can:

- Authenticate vehicles.
- View registered vehicles.
- View logs.
- Access the dashboard.

Officers cannot register/delete vehicles or manage users.

## 6. Database Setup

The database schema is located at:

```text
database/schema.sql
```

It creates the database:

```sql
campus_access_now
```

It also creates these tables:

- `users`
- `vehicles`
- `logs`
- `sessions`

### Default Admin Account

The schema automatically creates a default admin account:

```text
Username: admin
Password: admin123
```

## 7. Database Tables

### users

Stores admin and officer accounts.

Important fields:

- `id`
- `username`
- `password`
- `full_name`
- `role`
- `created_at`

### vehicles

Stores vehicle registration information.

Important fields:

- `plate_number`
- `owner_name`
- `matric_or_staff_id`
- `department`
- `phone`
- `vehicle_type`
- `vehicle_color`
- `category`
- `image_data_url`
- `registration_date`
- `valid_until`
- `status`

The vehicle image is stored in:

```sql
vehicles.image_data_url
```

The image is saved as a Base64 data URL inside MySQL, not as a separate `.jpg` or `.png` file.

### logs

Stores gate authentication history.

Important fields:

- `id`
- `plate_number`
- `type`
- `timestamp`
- `officer_username`
- `result`
- `reason`

### sessions

Stores login sessions.

Important fields:

- `token`
- `user_id`
- `expires_at`
- `created_at`

The session token is stored in a secure HTTP-only cookie called:

```text
vias_session
```

## 8. Installation and Running the Project

### Step 1: Start XAMPP

Open XAMPP and start:

- Apache, optional for phpMyAdmin
- MySQL, required

### Step 2: Import the Database

Open phpMyAdmin:

```text
http://localhost/phpmyadmin
```

Import or run:

```text
database/schema.sql
```

This creates the `campus_access_now` database and the required tables.

### Step 3: Start the API Server

In one terminal, run:

```bash
bun run api
```

The API server runs at:

```text
http://localhost:3001/api
```

### Step 4: Start the Frontend

In another terminal, run:

```bash
bun run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

## 9. Environment Variables

The API uses these defaults:

```text
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=campus_access_now
VIAS_API_PORT=3001
```

For normal XAMPP local development, these defaults usually work.

If your MySQL password is not empty, start the API like this:

```bash
DB_PASSWORD=your_password bun run api
```

## 10. Application Features

### Login

Users log in with username and password. When login is successful, the backend creates a session record in MySQL and sends a session cookie to the browser.

### Dashboard

The dashboard displays:

- Total registered vehicles
- Blacklisted vehicles
- Expired vehicles
- Number of officers
- Today's entries
- Recent activity

### Vehicle Registration

Admins can register a vehicle with:

- Plate number
- Category
- Owner full name
- Matric/staff/visitor/business ID
- Department
- Phone number
- Vehicle type
- Model description
- Vehicle color
- Registration date
- Valid until date
- Vehicle image

The vehicle image upload supports:

- Image preview before saving
- Image file validation
- Maximum image size of 2MB
- Change image
- Remove image

### Vehicle Management

Admins can:

- View vehicles
- Search vehicles
- Filter by status
- Edit records
- Delete vehicles
- Blacklist/unblacklist vehicles

Officers can view vehicles but cannot perform admin-only actions.

### Gate Authentication

The officer enters a plate number. The system searches the database and returns:

- Access granted if the vehicle is authorized and not expired.
- Access denied if the vehicle is not registered.
- Access denied if the vehicle is blacklisted.
- Access denied if the vehicle is expired.
- Access denied if the vehicle is marked unauthorized.

Every authentication attempt is logged automatically.

### Logs

The logs page shows all gate activity.

Logs can be filtered by:

- Plate number/officer search
- Entry or exit type
- Date

### Reports

The reports page shows:

- Registered vehicles
- Blacklisted vehicles
- Visitor records
- Authentication history
- Summary counts

Reports can be printed or exported as CSV.

## 11. API Endpoints

The frontend talks to the backend through `/api`.

### Auth

```text
POST /api/login
POST /api/logout
GET  /api/session
GET  /api/health
```

### Users

```text
GET    /api/users
POST   /api/users
DELETE /api/users/:id
```

Admin access is required for user management.

### Vehicles

```text
GET    /api/vehicles
GET    /api/vehicles/:plate
POST   /api/vehicles
PUT    /api/vehicles/:plate
PATCH  /api/vehicles/:plate
DELETE /api/vehicles/:plate
```

Admin access is required to create, update, blacklist, or delete vehicles.

### Logs

```text
GET  /api/logs
POST /api/logs
```

## 12. Vehicle Status Rules

Vehicle status can be:

```text
Authorized
Unauthorized
Expired
Blacklisted
```

The app calculates the effective status like this:

- If status is `Blacklisted`, the vehicle is denied.
- If status is `Unauthorized`, the vehicle is denied.
- If `valid_until` is in the past, the vehicle is treated as `Expired`.
- Otherwise, the stored status is used.

## 13. Image Storage Explanation

When a vehicle image is selected:

1. The browser reads the image using `FileReader`.
2. The image is converted to a Base64 data URL.
3. The Base64 value is saved in the frontend form as `imageDataUrl`.
4. On submit, the value is sent to the backend API.
5. The backend saves it in MySQL as `vehicles.image_data_url`.
6. When viewing or authenticating the vehicle, the image is loaded back from MySQL and displayed in an `<img>` tag.

This approach is simple for a student/local project because the image stays inside the database. For a larger production system, storing images as files and saving only the image path in MySQL would be better.

## 14. Security Notes

The current project is suitable for local/project demonstration, but these improvements are recommended for production:

- Hash passwords instead of storing plain text passwords.
- Use HTTPS.
- Add stronger input validation.
- Add audit logging for admin changes.
- Store uploaded images as files or object storage instead of Base64 in MySQL.
- Add role checks to every sensitive backend operation.
- Add password reset/change functionality.

## 15. Common Errors and Fixes

### Cannot connect to database

Make sure MySQL is running in XAMPP.

Also confirm:

```text
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_NAME=campus_access_now
```

### Login says invalid username or password

Confirm that `database/schema.sql` was imported successfully.

Default login:

```text
admin / admin123
```

### API requests fail

Make sure the API server is running:

```bash
bun run api
```

The frontend expects the API at:

```text
http://localhost:3001
```

### Frontend opens but data does not load

Run both servers:

```bash
bun run api
bun run dev
```

### Image does not save

Check:

- The selected file is an image.
- The selected file is under 2MB.
- The `vehicles` table has the `image_data_url` column.
- The API server is running.

## 16. Build and Verification

To build the project:

```bash
bun run build
```

To check the API script syntax:

```bash
node --check scripts/vias-api.mjs
```

The project build may print a Wrangler log-folder warning, but the build can still complete successfully.

## 17. Future Improvements

Possible improvements include:

- Password hashing with bcrypt.
- Image file storage instead of Base64 database storage.
- Pagination for vehicles and logs.
- Export logs as CSV/PDF.
- Add entry/exit toggle on the authentication page.
- Add vehicle owner profile page.
- Add admin activity audit trail.
- Add database backup and restore tools.
- Add stronger report charts and analytics.

## 18. Summary

VIAS is a campus vehicle registration and gate authentication system. It supports vehicle registration with image upload, role-based access, gate authentication, automatic access logging, reporting, and MySQL database persistence through XAMPP.

The system now works as a normal database-backed application instead of relying on browser storage.
