-- SQL Script to create guidance account
-- This script creates a guidance user account with the specified credentials
-- Run this in your Supabase SQL editor

-- First, create the user in auth.users (this will be done when they sign up)
-- For now, we'll create a placeholder profile that will be updated when they sign up

-- Insert guidance user profile if not exists
INSERT INTO profiles (
    email,
    full_name,
    role,
    created_at,
    last_sign_in
)
VALUES (
    'guidance@gmail.com',
    'Guidance Counselor',
    'guidance',
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
    role = 'guidance',
    full_name = 'Guidance Counselor',
    last_sign_in = NOW();

-- Note: The actual user account will be created when the guidance counselor signs up
-- with email: guidance@gmail.com and password: guidance123
-- The trigger function will automatically assign the correct role

-- Verify the profile was created
SELECT * FROM profiles WHERE email = 'guidance@gmail.com'; 