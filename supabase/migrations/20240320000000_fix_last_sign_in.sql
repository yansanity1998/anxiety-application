-- Drop existing table and related objects
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_last_sign_in() CASCADE;

-- Create profiles table
CREATE TABLE profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    age INTEGER,
    gender TEXT,
    school TEXT,
    course TEXT,
    year_level INTEGER,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    last_sign_in TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id)
);

-- Create function to handle new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        user_id, 
        email, 
        full_name,
        age,
        gender,
        school,
        course,
        year_level,
        role,
        created_at
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        (NEW.raw_user_meta_data->>'age')::INTEGER,
        NEW.raw_user_meta_data->>'gender',
        NEW.raw_user_meta_data->>'school',
        NEW.raw_user_meta_data->>'course',
        (NEW.raw_user_meta_data->>'year_level')::INTEGER,
        'user',
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update last_sign_in
CREATE OR REPLACE FUNCTION update_last_sign_in()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET last_sign_in = NOW()
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Create trigger for updating last_sign_in
CREATE TRIGGER on_auth_user_sign_in
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION update_last_sign_in();

-- Add RLS policies for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own profile
CREATE POLICY "Users can view their own profile"
    ON profiles
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile"
    ON profiles
    FOR UPDATE
    USING (user_id = auth.uid());

-- Policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON profiles
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Policy to allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
    ON profiles
    FOR DELETE
    USING (user_id = auth.uid());

-- Update existing profiles to fix full_name
UPDATE profiles p
SET full_name = COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name'
)
FROM auth.users u
WHERE p.user_id = u.id;

-- Update existing profiles to set last_sign_in
UPDATE profiles p
SET last_sign_in = u.last_sign_in_at
FROM auth.users u
WHERE p.user_id = u.id;

-- Insert admin user if not exists
INSERT INTO profiles (
    user_id, 
    email, 
    full_name,
    role,
    created_at
)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'),
    'admin',
    NOW()
FROM auth.users
WHERE email = 'admin@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'admin',
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name; 