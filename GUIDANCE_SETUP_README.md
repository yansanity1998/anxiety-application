# Guidance System Setup Guide

This guide will help you set up a complete guidance role system with the same privileges as admin for the anxiety application.

## 🎯 What We're Creating

- **Guidance Role**: A new role with full admin privileges
- **Guidance Account**: Email: `guidance@gmail.com`, Password: `guidance123`
- **Guidance Dashboard**: Redirects guidance users to `/guidance` route
- **Full Access**: Guidance users can view, edit, and manage all student data

## 🚀 Quick Setup Steps

### Step 1: Run the Database Setup Script

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `sql/setup_guidance_complete.sql`
4. Run the script

This script will:
- ✅ Add the `role` column to profiles table if it doesn't exist
- ✅ Update the `handle_new_user` function to support guidance role
- ✅ Create comprehensive RLS policies for guidance users
- ✅ Set up the database trigger for new users
- ✅ **Note**: Does NOT create the guidance user (that's step 2)

### Step 2: Create the Guidance User in Authentication System

1. In the same SQL Editor, copy and paste the contents of `sql/create_guidance_auth_user.sql`
2. Run this script

This script will:
- ✅ Create the guidance user in `auth.users` (same as admin)
- ✅ Set the password to `guidance123`
- ✅ The trigger will automatically create the profile entry
- ✅ The user will be ready to login immediately

### Step 3: Test the System

1. Go to your application's login page
2. Login with `guidance@gmail.com` and `guidance123`
3. You should be automatically redirected to `/guidance`
4. The guidance dashboard should display with full access to all data

## 🔧 How It Works

### User Creation in Authentication System

The guidance user is created in `auth.users` (the authentication system), not as a profile entry:

```sql
-- From create_guidance_auth_user.sql
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    -- ... other fields
)
VALUES (
    instance_id,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'guidance@gmail.com',
    crypt('guidance123', gen_salt('bf')),
    -- ... other values
);
```

### Automatic Profile Creation

When the guidance user is created in `auth.users`, the trigger automatically creates the profile:

```sql
-- From handle_new_user() function
CASE 
    WHEN NEW.email = 'admin@gmail.com' THEN 'admin'
    WHEN NEW.email = 'guidance@gmail.com' THEN 'guidance'
    ELSE 'user' 
END
```

### Role Assignment Logic

The system automatically assigns roles based on email addresses:

```typescript
// From Login.tsx
const isAdminAttempt = email.toLowerCase() === 'admin@gmail.com';
const isGuidanceAttempt = email.toLowerCase() === 'guidance@gmail.com';

if (isAdminAttempt || userProfile.role === 'admin') {
  navigate('/admin');
} else if (isGuidanceAttempt || userProfile.role === 'guidance') {
  navigate('/guidance');
} else {
  navigate('/assessment');
}
```

### RLS Policies

Guidance users have full access to:
- ✅ **profiles** table (view, insert, update, delete)
- ✅ **anxiety_assessments** table (view, insert, update, delete)

## 🧪 Testing

### Manual Testing

1. **Login Test**: Try logging in with guidance credentials
2. **Redirect Test**: Verify you're redirected to `/guidance`
3. **Access Test**: Check if you can view all student data
4. **Permissions Test**: Verify you can edit student information

### Automated Testing

Run the test script to verify everything works:

```bash
# Set your Supabase credentials
export SUPABASE_URL="your_supabase_url"
export SUPABASE_ANON_KEY="your_supabase_anon_key"

# Run the test
node scripts/test_guidance_system.js
```

## 🚨 Troubleshooting

### Common Issues

1. **"Role column doesn't exist"**
   - Run the setup script again
   - Check if the profiles table has the role column

2. **"Access denied" errors**
   - Verify RLS policies are created
   - Check if the guidance profile has the correct role

3. **"User not found" errors**
   - Make sure you ran `create_guidance_auth_user.sql`
   - Check if the user exists in `auth.users`

4. **Redirect not working**
   - Check the Login.tsx logic
   - Verify the profile role is set to 'guidance'

5. **Dashboard not loading**
   - Check if the `/guidance` route exists in App.tsx
   - Verify the GuidanceDashboard component is imported

### Debug Steps

1. Check the browser console for errors
2. Verify the user exists in `auth.users` table
3. Check if the profile was created in `profiles` table
4. Check RLS policies in Supabase
5. Test the login flow step by step

## 📁 Files Modified

- `sql/setup_guidance_complete.sql` - Database setup script (policies and functions)
- `sql/create_guidance_auth_user.sql` - Creates guidance user in auth.users
- `scripts/test_guidance_system.js` - Test script
- `src/auth/Login.tsx` - Already has guidance logic
- `src/App.tsx` - Already has guidance routing
- `src/admin/GuidanceDashboard.tsx` - Already exists

## 🔒 Security Notes

- Guidance users have the same privileges as admin users
- They can access all student data and assessments
- RLS policies ensure proper access control
- The system automatically assigns roles based on email
- Users are created in the authentication system, not as profile entries

## ✅ Verification Checklist

- [ ] Database setup script executed successfully
- [ ] Guidance user created in auth.users table
- [ ] Profile entry created automatically by trigger
- [ ] Login works with guidance@gmail.com / guidance123
- [ ] Login redirects to `/guidance` route
- [ ] Guidance dashboard loads without errors
- [ ] Can view all student profiles
- [ ] Can view all anxiety assessments
- [ ] Can edit student information
- [ ] Test script passes all checks

## 🎉 Success!

Once all steps are completed, you'll have a fully functional guidance system that:

- ✅ Creates guidance users in the authentication system (same as admin)
- ✅ Automatically assigns guidance role to `guidance@gmail.com`
- ✅ Redirects guidance users to the guidance dashboard
- ✅ Provides full access to all student data
- ✅ Maintains security through RLS policies
- ✅ Works seamlessly with the existing admin system

The guidance counselor can now log in and access all the tools they need to support students with anxiety management. 