-- Add streak tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_activity_date DATE DEFAULT CURRENT_DATE;

-- Update the handle_new_user function to include the new fields
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Check if the user is admin
    is_admin := NEW.email = 'admin@gmail.com';
    
    INSERT INTO public.profiles (
        user_id, 
        email, 
        full_name,
        age,
        gender,
        school,
        course,
        year_level,
        phone_number,
        guardian_name,
        guardian_phone_number,
        address,
        role,
        streak,
        last_activity_date,
        created_at,
        last_sign_in
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
        NEW.raw_user_meta_data->>'phone_number',
        NEW.raw_user_meta_data->>'guardian_name',
        NEW.raw_user_meta_data->>'guardian_phone_number',
        NEW.raw_user_meta_data->>'address',
        CASE WHEN is_admin THEN 'admin' ELSE 'user' END,
        1, -- Default streak
        CURRENT_DATE, -- Default last activity date
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT USAGE ON SEQUENCE profiles_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE profiles_id_seq TO service_role; 