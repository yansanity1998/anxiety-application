# CBT Modules Setup Guide

## 🚨 **IMPORTANT: Database Setup Required**

The CBT modules system requires the database table to be created first. Follow these steps:

### Step 1: Create the Database Table

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the entire content from `scripts/setup_cbt_modules.sql`
4. Click **Run** to execute the script

### Step 2: Verify the Setup

After running the script, you should see:
- A new `cbt_module` table in your database
- Row Level Security (RLS) policies for different user roles
- Sample data for testing

### Step 3: Test the System

1. **Admin Access**: Admins should be able to see all modules and create/edit/delete them
2. **Guidance Access**: Guidance counselors should have the same permissions as admins
3. **Student Access**: Students should only see their own assigned modules

## 🔧 **Troubleshooting**

### If Guidance Can't See Modules:

1. **Check User Role**: Ensure the guidance user has `role = 'guidance'` in the profiles table
2. **Check Authentication**: Make sure the user is properly authenticated
3. **Check Console**: Look for any error messages in the browser console
4. **Verify Policies**: Ensure the RLS policies were created correctly

### If Students Can't See Modules:

1. **Check Profile ID**: Ensure the student has a profile in the profiles table
2. **Check Module Assignment**: Verify that modules are assigned to the correct profile_id
3. **Check Role**: Ensure the student has `role = 'student'` in the profiles table

## 📋 **Database Schema**

The `cbt_module` table has the following structure:

```sql
CREATE TABLE cbt_module (
    id BIGSERIAL PRIMARY KEY,
    profile_id BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
    module_title TEXT NOT NULL,
    module_description TEXT NOT NULL,
    module_status TEXT NOT NULL DEFAULT 'not_started',
    module_date_started TIMESTAMP WITH TIME ZONE,
    module_date_complete TIMESTAMP WITH TIME ZONE,
    module_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔐 **Security Policies**

The system includes Row Level Security (RLS) policies:

- **Students**: Can only view and update their own modules
- **Guidance**: Can view, create, update, and delete all modules
- **Admins**: Can view, create, update, and delete all modules

## 🎯 **Features Added**

✅ **Title and Description Labels**: All modules now show "Title:" and "Description:" labels
✅ **Compact Cards**: Smaller, more efficient card layout
✅ **Clickable Images**: Students can click on module images to view details
✅ **Status Under Image**: Status badges are positioned below images
✅ **Removed "Not Started" Stats**: Cleaner statistics display
✅ **Enhanced UI**: Better visual hierarchy and user experience

## 🚀 **Next Steps**

After setting up the database:

1. Test the system with different user roles
2. Create some sample modules for testing
3. Verify that all CRUD operations work correctly
4. Check that the UI improvements are working as expected

If you encounter any issues, check the browser console for error messages and ensure all database policies are properly set up. 