-- Migration: Add user_type column to users table
-- Run this with: sqlite3 test.db < add_user_type_column.sql

-- Check current schema
.schema users

-- Add the user_type column with default value 'general'
ALTER TABLE users ADD COLUMN user_type VARCHAR DEFAULT 'general' NOT NULL;

-- Verify the column was added
.schema users

-- Show all users with their new user_type
SELECT id, username, user_type FROM users;

.quit
