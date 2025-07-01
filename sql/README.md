# SQL Directory

This directory contains all SQL scripts for database setup, fixes, and migrations for the anxiety application.

## Database Setup & Migrations

### Core Tables
- **`setup_streak_tracking.sql`** - Adds streak tracking columns to profiles table
- **`fix_assessment_table.sql`** - Creates and fixes anxiety_assessments table structure
- **`fix_assessment_structure.sql`** - Ensures proper assessment table structure

### Profile Management
- **`fix_id_number_column.sql`** - Adds missing id_number column to profiles table
- **`fix_profile_streak_init.sql`** - Initializes streak values for existing profiles
- **`update_profile_function.sql`** - Updates profile management functions

## Authentication & Permissions

### Login & Auth Fixes
- **`fix_login_authentication.sql`** - Comprehensive authentication system fix
- **`fix_login_issue.sql`** - Fixes login-related database issues
- **`fix_auth_permissions.sql`** - Sets up proper Row Level Security policies

### Admin Management
- **`fix_admin_role.sql`** - Fixes admin role assignment
- **`fix_admin_profile.sql`** - Creates/updates admin profile
- **`ensure_admin_profile.sql`** - Ensures admin profile exists
- **`fix_admin_user.sql`** - Fixes admin user creation

## Streak System

### Streak Tracking
- **`fix_streak_login_issue.sql`** - Fixes streak updates during login
- **`fix_streak_values.sql`** - Fixes streak calculation issues
- **`simple_streak_fix.sql`** - Simple streak system fixes

## Assessment System

### Assessment Management
- **`fix_assessment_saving.sql`** - Fixes assessment saving functionality
- **`fix_infinite_recursion.sql`** - Fixes recursive function issues

## User Management

### User Operations
- **`fix_user_deletion.sql`** - Fixes user deletion functionality
- **`fix_admin_dashboard_users.sql`** - Fixes admin dashboard user queries

## Testing & Debugging

### Test Scripts
- **`simple_admin_test.sql`** - Simple admin functionality test
- **`test_admin_dashboard_users.sql`** - Tests admin dashboard user queries
- **`test_profile_creation.sql`** - Tests profile creation process
- **`debug_admin_profile.sql`** - Debug script for admin profile issues
- **`check_users.sql`** - Utility to check user data

## Triggers & Functions

### Database Triggers
- **`fix_contact_info_trigger.sql`** - Fixes contact information triggers

## Usage

### Running Scripts
1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of the desired SQL file
4. Click "Run" to execute the script

### Order of Execution
For a fresh setup, run scripts in this order:
1. Core table setup scripts
2. Authentication and permission scripts
3. Admin setup scripts
4. Streak system scripts
5. Assessment system scripts

### Testing
After running fixes, use the corresponding test scripts to verify functionality.

## Notes

- Always backup your database before running these scripts
- Test in a development environment first
- Some scripts may need to be run multiple times if there are conflicts
- Check the documentation files for specific usage instructions 