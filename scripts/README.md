# Scripts Directory

This directory contains various JavaScript test and utility scripts for the anxiety application.

## Test Scripts

### Authentication & Login
- **`test_authentication.js`** - Tests user authentication and login functionality
- **`test_registration_fix.js`** - Tests user registration and profile creation

### Admin Dashboard
- **`test_admin_dashboard.js`** - Tests admin dashboard functionality
- **`debug_admin_dashboard.js`** - Debug script for admin dashboard issues

### Assessment & Streak
- **`test_assessment_save.js`** - Tests anxiety assessment saving functionality
- **`test_streak_service.js`** - Tests streak tracking and calculation
- **`test_streak_login.js`** - Tests streak updates during login

### Browser Testing
- **`simple_browser_test.js`** - Simple browser-based testing utilities

## Usage

To run any of these scripts, use Node.js from the project root:

```bash
node scripts/[script-name].js
```

## Configuration

Most scripts require Supabase credentials. Update the script files with your Supabase URL and API keys before running them.

## Notes

- These scripts are primarily for testing and debugging purposes
- They can be safely deleted once the application is stable
- Always test in a development environment first 