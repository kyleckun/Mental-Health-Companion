@echo off
echo ============================================================
echo Database Migration: Add user_type column to users table
echo ============================================================
echo.

python migrate_add_user_type.py

echo.
echo Migration complete! You can now restart the backend server.
echo ============================================================
pause
