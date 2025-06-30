# Registration Fix Instructions

## Problem
When registering a new account, you get the error:
```
"Registration Failed
Failed to create user profile: Could not find the 'id_number' column of 'profiles' in the schema cache"
```

## Root Cause
The `profiles` table in your Supabase database is missing the `id_number` column, but the registration code is trying to insert data into this column.

## Solution

### Step 1: Run the Database Fix
1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `fix_id_number_column.sql` into the editor
4. Click "Run" to execute the script

This script will:
- Add the missing `id_number` column to the profiles table
- Add any other missing columns (phone_number, guardian_name, etc.)
- Update the `handle_new_user` function to include the id_number field
- Fix the database trigger and RLS policies
- Grant necessary permissions

### Step 2: Verify the Fix
After running the SQL script, you can verify it worked by:

1. **Check the table structure** - The script includes a query to show all columns in the profiles table
2. **Test registration** - Try registering a new account
3. **Run the test script** - Use `test_registration_fix.js` to verify the database schema

### Step 3: Code Changes (Already Applied)
The registration code has been updated to:
- Remove manual profile creation (the database trigger handles this)
- Add better error handling
- Simplify the registration flow

## What the Fix Does

### Database Changes:
1. **Adds missing columns** to the profiles table:
   - `id_number TEXT`
   - `phone_number TEXT`
   - `guardian_name TEXT`
   - `guardian_phone_number TEXT`
   - `address TEXT`
   - `streak INTEGER DEFAULT 1`
   - `last_activity_date DATE DEFAULT CURRENT_DATE`

2. **Updates the trigger function** to include all required fields when creating profiles automatically

3. **Fixes RLS policies** to allow profile creation during registration

### Code Changes:
1. **Removes manual profile insertion** - The database trigger now handles this automatically
2. **Adds verification** - Checks if the profile was created by the trigger
3. **Improves error handling** - Continues registration even if profile verification fails

## Testing the Fix

### Option 1: Manual Test
1. Try registering a new account with all required fields
2. Check if the registration completes successfully
3. Verify the user data appears in the Supabase profiles table

### Option 2: Automated Test
1. Update the `test_registration_fix.js` file with your Supabase credentials
2. Run the test script to verify the database schema
3. The script will test inserting and deleting a test profile

## Expected Result
After applying the fix:
- ✅ Registration should complete successfully
- ✅ User profile should be created automatically
- ✅ All user data should be saved correctly
- ✅ No more "id_number column" errors

## Troubleshooting

### If the error persists:
1. **Check Supabase logs** - Look for any database errors in the Supabase dashboard
2. **Verify column exists** - Run the verification queries in the fix script
3. **Check RLS policies** - Ensure the insert policy allows profile creation
4. **Clear browser cache** - Sometimes cached schema information can cause issues

### If registration works but data is missing:
1. **Check the trigger function** - Verify `handle_new_user` function exists and is working
2. **Check user metadata** - Ensure the registration form is sending all required data
3. **Verify permissions** - Make sure the service role has proper permissions

## Files Modified
- `fix_id_number_column.sql` - Database fix script
- `src/auth/Register.tsx` - Updated registration logic
- `test_registration_fix.js` - Test script for verification
- `REGISTRATION_FIX_INSTRUCTIONS.md` - This documentation

## Next Steps
1. Run the database fix script
2. Test registration with a new account
3. Verify all user data is saved correctly
4. If everything works, you can delete the test files (`fix_id_number_column.sql`, `test_registration_fix.js`, `REGISTRATION_FIX_INSTRUCTIONS.md`) 