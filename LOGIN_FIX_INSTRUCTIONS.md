# Login Fix Instructions

## Problem Summary
Your authentication system has several issues preventing both student and admin logins:
1. Database schema conflicts from multiple migration files
2. Restrictive Row Level Security (RLS) policies
3. Missing or broken trigger functions
4. Login component requiring "Remember me" checkbox

## Solution Steps

### Step 1: Run the Database Fix
1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the entire contents of `sql/fix_login_authentication.sql`
4. Run the SQL script
5. This will:
   - Drop and recreate all tables with proper structure
   - Set up correct RLS policies
   - Create working trigger functions
   - Grant proper permissions
   - Create admin profile if it exists

### Step 2: Verify the Fix
After running the SQL script, you should see a query result showing your profiles. If you see any profiles listed, the fix worked.

### Step 3: Test Authentication
1. Open your application in the browser
2. Open the browser console (F12)
3. Copy and paste the contents of `scripts/test_authentication.js` into the console
4. Run `testAuthentication()` to verify everything is working

### Step 4: Test Login
Try logging in with your existing accounts:
- **Student accounts**: Use any student email/password
- **Admin account**: Use `admin@gmail.com` with the admin password

### Step 5: If Login Still Fails
If you still can't log in, try these troubleshooting steps:

1. **Check if users exist in auth.users**:
   ```sql
   SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;
   ```

2. **Check if profiles exist**:
   ```sql
   SELECT user_id, email, role FROM profiles ORDER BY created_at DESC;
   ```

3. **Create missing profiles manually**:
   ```sql
   -- For admin user
   INSERT INTO profiles (user_id, email, role, created_at, last_sign_in, streak, last_activity_date)
   SELECT id, email, 'admin', NOW(), NOW(), 1, CURRENT_DATE
   FROM auth.users WHERE email = 'admin@gmail.com'
   ON CONFLICT (user_id) DO NOTHING;
   
   -- For student users
   INSERT INTO profiles (user_id, email, role, created_at, last_sign_in, streak, last_activity_date)
   SELECT id, email, 'student', NOW(), NOW(), 1, CURRENT_DATE
   FROM auth.users WHERE email != 'admin@gmail.com'
   ON CONFLICT (user_id) DO NOTHING;
   ```

## What Was Fixed

### Database Issues:
- ✅ Dropped conflicting table structures
- ✅ Created clean, consistent schema
- ✅ Fixed RLS policies to allow proper access
- ✅ Created working trigger functions
- ✅ Added proper permissions

### Login Component Issues:
- ✅ Removed "Remember me" requirement
- ✅ Added profile existence check
- ✅ Improved error handling
- ✅ Better role detection

### Admin Login Issues:
- ✅ Enhanced error handling
- ✅ Automatic profile creation
- ✅ Better admin role detection

## Key Changes Made

1. **Profiles Table**: Now uses `user_id` as primary key (UUID) instead of auto-increment ID
2. **RLS Policies**: Simplified and made more permissive for authentication
3. **Trigger Functions**: Created robust functions that don't fail on errors
4. **Login Flow**: Removed unnecessary requirements and added safety checks

## Testing Your Fix

After applying the fix, you should be able to:

1. **Login as a student**: Any student account should work
2. **Login as admin**: `admin@gmail.com` should work
3. **Access profiles**: Users should be able to view their own profiles
4. **Create assessments**: Students should be able to save anxiety assessments
5. **Admin dashboard**: Admin should be able to access admin features

## Common Issues and Solutions

### "Invalid email or password"
- Check if the user exists in `auth.users` table
- Verify the password is correct
- Try resetting the password in Supabase Auth settings

### "Access denied: Admin privileges required"
- Check if the user has `role = 'admin'` in the profiles table
- Verify the email is `admin@gmail.com`

### "Profile not found"
- The `ensure_profile_exists` function should create missing profiles
- Check if the function executed successfully

### "RLS policy violation"
- The new RLS policies should be more permissive
- Check if the user is properly authenticated

## Support

If you're still having issues after following these steps:

1. Check the browser console for error messages
2. Run the test script to identify specific problems
3. Check the Supabase logs for database errors
4. Verify your Supabase URL and API keys are correct

The fix should resolve all authentication issues and allow both student and admin logins to work properly. 