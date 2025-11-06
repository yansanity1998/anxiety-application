-- Add original_role field to profiles table to preserve role before archiving
-- This allows proper restoration of guidance/admin roles when unarchiving

-- Add the original_role column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS original_role TEXT;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_original_role ON public.profiles(original_role);

-- Add a comment to explain the field's purpose
COMMENT ON COLUMN public.profiles.original_role IS 'Stores the user role before archiving to enable proper restoration';
