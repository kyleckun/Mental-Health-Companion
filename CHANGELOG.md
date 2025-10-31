# Changelog

## [2025-10-29] - Major Frontend Update

### Added
- **Login Page** - Complete authentication system with JWT
  - Username/email login support
  - Remember me functionality
  - Beautiful gradient UI with animations
- **Register Page** - User registration with validation
  - Password strength indicator
  - Real-time form validation
  - Email format validation
- **Protected Routes** - Authentication guard for secure pages
- **Auth Service** - Centralized authentication management
  - Token storage (localStorage/sessionStorage)
  - Auto token refresh
  - Login/logout functionality

### Changed
- **Project Structure** - Cleaned up duplicate code
  - Removed old `src/` directory from root
  - Consolidated all frontend code in `frontend/` directory
  - Added cleanup script (`cleanup_old_files.bat`)
- **Code Refactoring** - Full internationalization
  - Translated all Chinese comments to English
  - Translated all UI strings to English
  - Removed decorative separator comments
  - Improved code readability
- **AI Chat Interface** - Enhanced with streaming support
  - Real-time message streaming
  - Request cancellation support
  - Better error handling
- **App Structure** - Improved routing
  - Added React Router integration
  - Public vs protected route separation
  - Auto-redirect logic

### Updated Dependencies
- Added `react-router-dom` for routing
- Added `axios` for HTTP requests
- Updated all npm packages

### Testing Status
- Frontend tested and working
- Backend testing pending

### Next Steps
- Backend integration testing
- Deploy to production
- Add more features (mood journal, trends)

---

## Team Members
Please read `README.md` for setup instructions before testing!
