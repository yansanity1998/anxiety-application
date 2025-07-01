-- Create a function to update a profile by ID
CREATE OR REPLACE FUNCTION update_profile_by_id(
  p_id BIGINT,
  p_full_name TEXT,
  p_age INTEGER,
  p_gender TEXT,
  p_school TEXT,
  p_course TEXT,
  p_year_level INTEGER,
  p_phone_number TEXT,
  p_guardian_name TEXT,
  p_guardian_phone_number TEXT,
  p_address TEXT
) RETURNS VOID AS $$
BEGIN
  -- Log the update operation
  RAISE LOG 'Updating profile ID % with name %', p_id, p_full_name;
  
  -- Update the profile
  UPDATE profiles
  SET 
    full_name = p_full_name,
    age = p_age,
    gender = p_gender,
    school = p_school,
    course = p_course,
    year_level = p_year_level,
    phone_number = p_phone_number,
    guardian_name = p_guardian_name,
    guardian_phone_number = p_guardian_phone_number,
    address = p_address
  WHERE id = p_id;

  -- Log the result
  RAISE LOG 'Updated profile ID %', p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_profile_by_id TO authenticated;
GRANT EXECUTE ON FUNCTION update_profile_by_id TO anon;
GRANT EXECUTE ON FUNCTION update_profile_by_id TO service_role; 