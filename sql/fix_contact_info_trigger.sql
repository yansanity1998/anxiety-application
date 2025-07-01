-- Drop and recreate the handle_new_user trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Check if the user is admin
    is_admin := NEW.email = 'admin@gmail.com';
    
    -- Debug log
    RAISE LOG 'Creating new profile for %: Raw metadata: %', NEW.email, NEW.raw_user_meta_data;
    
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
        CASE WHEN is_admin THEN 'admin' ELSE 'student' END,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is properly attached to the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user(); 