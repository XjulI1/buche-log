-- Buche-Log Database Schema
-- Run this script on your MariaDB instance to create the required tables

CREATE DATABASE IF NOT EXISTS buche_log
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE buche_log;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  api_token VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_api_token (api_token(255))
);

-- Racks table
CREATE TABLE IF NOT EXISTS racks (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  height DECIMAL(10, 2) NOT NULL,
  width DECIMAL(10, 2) NOT NULL,
  depth DECIMAL(10, 2) NOT NULL,
  log_size ENUM('25', '33', '50') NOT NULL,
  volume_m3 DECIMAL(10, 4) NOT NULL,
  volume_steres DECIMAL(10, 4) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_racks_user_id (user_id),
  INDEX idx_racks_updated_at (updated_at),
  INDEX idx_racks_deleted_at (deleted_at)
);

-- Consumptions table
CREATE TABLE IF NOT EXISTS consumptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  rack_id VARCHAR(36) NOT NULL,
  type ENUM('reload', 'consumption') NOT NULL,
  percentage TINYINT UNSIGNED NOT NULL,
  date DATE NOT NULL,
  week_number TINYINT UNSIGNED NOT NULL,
  year SMALLINT UNSIGNED NOT NULL,
  notes TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (rack_id) REFERENCES racks(id) ON DELETE CASCADE,
  INDEX idx_consumptions_user_id (user_id),
  INDEX idx_consumptions_rack_id (rack_id),
  INDEX idx_consumptions_year_week (year, week_number),
  INDEX idx_consumptions_updated_at (updated_at),
  INDEX idx_consumptions_deleted_at (deleted_at)
);

-- Sync metadata table
CREATE TABLE IF NOT EXISTS sync_metadata (
  user_id VARCHAR(36) PRIMARY KEY,
  last_sync_timestamp DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
