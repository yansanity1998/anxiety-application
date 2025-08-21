# Guidance Account Setup Instructions

This guide will help you create a guidance account with full access to all data in your Supabase database.

## 🎯 What This Setup Does

1. **Creates a guidance account** with credentials:
   - Email: `guidance@gmail.com`
   - Password: `guidance123`
   - Role: `guidance`

2. **Sets up comprehensive policies** so the guidance account can:
   - View all user profiles
   - View all anxiety assessments
   - Update user information
   - Access all data in the system

3. **Ensures no disruption** to existing admin and user accounts

## 📋 Prerequisites

- Access to your Supabase project
- SQL Editor access in Supabase Dashboard
- Existing `profiles` and `anxiety_assessments` tables

## 🚀 Step-by-Step Setup

### Step 1: Run the Main Setup Script

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `create_guidance_account_complete.sql`
4. Click **Run** to execute the script

### Step 2: Verify the Setup

1. In the same SQL Editor, run the contents of `test_guidance_access.sql`
2. Check that all tests show ✅ PASS results

### Step 3: Test Login

1. Go to your application's login page
2. Login with:
   - Email: `guidance@gmail.com`
   - Password: `guidance123`
3. Verify you can access all data

## 🔍 What Gets Created

### Database Changes
- New user in `auth.users` table
- New profile in `profiles` table with `role = 'guidance'`
- Updated `handle_new_user()` function to support guidance role
- Comprehensive RLS policies for guidance access

### Policies Created
- **Profiles table**: Full CRUD access for guidance users
- **Anxiety Assessments table**: Full CRUD access for guidance users
- **User management**: Guidance can view and manage all users

## 🛡️ Security Features

- **Row Level Security (RLS)** is maintained
- **Guidance role verification** for all operations
- **No bypass** of existing security measures
- **Audit trail** maintained for all operations

## 🔧 Troubleshooting

### If the guidance user can't login:
1. Check if the user was created in `auth.users`
2. Verify the profile exists in `profiles` table
3. Ensure the role is set to `'guidance'`

### If the guidance user can't access data:
1. Run the test script to identify missing policies
2. Check if RLS policies are properly created
3. Verify table permissions are granted

### If you get permission errors:
1. Ensure you're running the script as a superuser/service role
2. Check if the `handle_new_user()` function was updated
3. Verify the trigger is properly set up

## 📊 Verification Commands

After setup, you can verify everything works with these SQL commands:

```sql
-- Check if guidance user exists
SELECT * FROM auth.users WHERE email = 'guidance@gmail.com';

-- Check if guidance profile exists
SELECT * FROM profiles WHERE email = 'guidance@gmail.com';

-- Check guidance policies
SELECT * FROM pg_policies WHERE policyname LIKE '%guidance%';
```

## 🎉 Success Indicators

You'll know the setup is complete when:

1. ✅ All test results show "PASS"
2. ✅ You can login with `guidance@gmail.com` / `guidance123`
3. ✅ The guidance account can view all user data
4. ✅ The guidance account can view all assessment data
5. ✅ Existing admin and user accounts still work normally

## 🔄 Rollback (If Needed)

If you need to remove the guidance account:

```sql
-- Remove guidance user from auth.users
DELETE FROM auth.users WHERE email = 'guidance@gmail.com';

-- Remove guidance profile
DELETE FROM profiles WHERE email = 'guidance@gmail.com';

-- Remove guidance policies
DROP POLICY IF EXISTS "Guidance can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Guidance can update profiles" ON profiles;
-- (repeat for all guidance policies)
```

## 📞 Support

If you encounter issues:
1. Check the test script results first
2. Verify all SQL commands executed successfully
3. Check the Supabase logs for any error messages
4. Ensure your database schema matches the expected structure

---

**Note**: This setup creates a guidance account with the same level of access as an admin account. The guidance role is designed for counselors and support staff who need to view and manage user data for counseling purposes. 