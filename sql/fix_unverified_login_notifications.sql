-- Fix login notifications for unverified users
-- The issue: Database trigger updates last_sign_in for ALL authenticated users,
-- causing login notifications even for users who will be blocked due to verification status

-- 1. Drop the existing trigger that updates last_sign_in automatically
DROP TRIGGER IF EXISTS on_auth_user_sign_in ON auth.users;

-- 2. Create a new function that only updates last_sign_in for verified users
CREATE OR REPLACE FUNCTION public.update_last_sign_in_verified_only()
RETURNS TRIGGER AS $$
DECLARE
    user_profile RECORD;
BEGIN
    -- Get the user's profile to check verification status and role
    SELECT role, is_verified INTO user_profile
    FROM public.profiles
    WHERE user_id = NEW.id;
    
    -- Only update last_sign_in if:
    -- 1. User is admin or guidance (privileged roles), OR
    -- 2. User is verified student
    IF user_profile.role IN ('admin', 'guidance') OR 
       (user_profile.role = 'student' AND user_profile.is_verified = true) THEN
        
        UPDATE public.profiles
        SET last_sign_in = NOW()
        WHERE user_id = NEW.id;
        
        RAISE LOG 'Updated last_sign_in for verified user: % (role: %, verified: %)', 
                  NEW.email, user_profile.role, user_profile.is_verified;
    ELSE
        RAISE LOG 'Skipped last_sign_in update for unverified user: % (role: %, verified: %)', 
                  NEW.email, user_profile.role, user_profile.is_verified;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the sign in
    RAISE LOG 'Error in update_last_sign_in_verified_only for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create new trigger that only updates last_sign_in for verified users
CREATE TRIGGER on_auth_user_sign_in_verified
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION public.update_last_sign_in_verified_only();

-- 4. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.update_last_sign_in_verified_only() TO service_role;

-- Note: This ensures that unverified users won't trigger login notifications
-- because their last_sign_in field won't be updated by the database trigger.
-- The frontend Login.tsx component will handle last_sign_in updates manually
-- for verified users only.
