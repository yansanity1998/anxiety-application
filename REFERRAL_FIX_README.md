# Referral System Fix

## Problem
The referral system was not working because the `referrals` table didn't exist in the database. When you tried to create a referral, it would get stuck in the modal because the database insert was failing.

## Solution
I've created the missing `referrals` table and fixed the component to handle errors properly.

## Files Created/Modified

### 1. Database Table
- `sql/create_referrals_table.sql` - SQL to create the referrals table
- `supabase/migrations/20240320000009_create_referrals.sql` - Migration file

### 2. Component Fixes
- `src/admin/components/Referral.tsx` - Fixed modal closing and error handling

### 3. Setup Script
- `scripts/setup_referrals_table.js` - Script to automatically create the table

## How to Fix

### Option 1: Run the Setup Script (Recommended)
```bash
cd scripts
npm install dotenv
node setup_referrals_table.js
```

### Option 2: Manual Database Setup
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `sql/create_referrals_table.sql`
4. Execute the SQL

### Option 3: Use Migration
If you have Supabase CLI set up:
```bash
supabase db push
```

## What the Fix Does

1. **Creates the referrals table** with proper structure and relationships
2. **Sets up Row Level Security** policies for admin and guidance users
3. **Fixes the modal closing** issue by properly handling the form submission
4. **Adds error handling** for when the table doesn't exist
5. **Improves user feedback** with success/error messages

## Table Structure
The referrals table includes:
- Student information (ID, name)
- Psychiatrist details (name, email, phone)
- Referral reason and urgency level
- Status tracking (pending, sent, acknowledged, etc.)
- File attachments support
- Timestamps and audit fields

## After the Fix
1. ✅ Modal will close properly after creating a referral
2. ✅ New referrals will appear in the list immediately
3. ✅ Export functionality will work (CSV, Excel, Word)
4. ✅ Email functionality will work
5. ✅ Status updates will work properly

## Testing
After running the fix:
1. Go to Admin Dashboard → Referral
2. Click "New Referral"
3. Fill out the form and submit
4. The modal should close and the referral should appear in the list
5. Try the export and email features

## Troubleshooting
If you still have issues:
1. Check the browser console for errors
2. Verify the referrals table exists in your Supabase database
3. Check that your user has admin role permissions
4. Ensure RLS policies are properly set up 