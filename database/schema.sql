CREATE DATABASE IF NOT EXISTS campus_access_now
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campus_access_now;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  role ENUM('admin', 'officer') NOT NULL DEFAULT 'officer',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  plate_number VARCHAR(40) PRIMARY KEY,
  owner_name VARCHAR(160) NOT NULL,
  matric_or_staff_id VARCHAR(80) NOT NULL,
  department VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  vehicle_type VARCHAR(160) NOT NULL,
  vehicle_color VARCHAR(80) NOT NULL,
  category ENUM('Staff', 'Student', 'Visitor', 'Business Person') NOT NULL,
  image_data_url LONGTEXT NULL,
  registration_date DATETIME NOT NULL,
  valid_until DATETIME NOT NULL,
  status ENUM('Authorized', 'Unauthorized', 'Expired', 'Blacklisted') NOT NULL DEFAULT 'Authorized'
);

CREATE TABLE IF NOT EXISTS logs (
  id VARCHAR(36) PRIMARY KEY,
  plate_number VARCHAR(40) NOT NULL,
  type ENUM('ENTRY', 'EXIT') NOT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  officer_username VARCHAR(80) NOT NULL,
  result ENUM('GRANTED', 'DENIED') NOT NULL,
  reason VARCHAR(255) NULL,
  INDEX logs_timestamp_idx (timestamp),
  INDEX logs_plate_number_idx (plate_number)
);

CREATE TABLE IF NOT EXISTS sessions (
  token CHAR(64) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX sessions_user_id_idx (user_id),
  CONSTRAINT sessions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (id, username, password, full_name, role)
SELECT UUID(), 'admin', 'admin123', 'Atabor Arome', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
