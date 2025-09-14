-- Updated diagnostic script for the new referrals table structure
-- Run this in your Supabase SQL Editor to verify the updated table

-- 1. Check if table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'referrals') 
        THEN '✅ Referrals table exists' 
        ELSE '❌ Referrals table does not exist' 
    END as table_status;

-- 2. Show complete table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'referrals'
ORDER BY ordinal_position;

-- 3. Show foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'referrals';

-- 4. Show check constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'referrals' AND tc.constraint_type = 'CHECK';

-- 5. Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS enabled'
        ELSE '❌ RLS disabled'
    END as rls_status
FROM pg_tables 
WHERE tablename = 'referrals';

-- 6. Show policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'referrals';

-- 7. Test basic insert with new structure
DO $$
DECLARE
    test_student_id BIGINT;
    test_admin_id BIGINT;
    test_student_name TEXT;
BEGIN
    -- Get a sample student ID and name
    SELECT id, full_name INTO test_student_id, test_student_name 
    FROM profiles 
    WHERE role IN ('student', 'user') 
    LIMIT 1;
    
    -- Get a sample admin ID
    SELECT id INTO test_admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
    
    IF test_student_id IS NULL THEN
        RAISE NOTICE '❌ No student profiles found';
        RETURN;
    END IF;
    
    IF test_admin_id IS NULL THEN
        RAISE NOTICE '❌ No admin profiles found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing with student_id: %, student_name: %, admin_id: %', test_student_id, test_student_name, test_admin_id;
    
    -- Try to insert a test record with new structure
    INSERT INTO referrals (
        student_id,
        student_name,
        referred_by,
        referred_by_faculty,
        reason_academic_concerns,
        reason_behavioral_issues,
        brief_description_of_concern,
        urgency_level,
        preferred_face_to_face_individual
    ) VALUES (
        test_student_id,
        test_student_name,
        test_admin_id,
        TRUE,
        TRUE,
        FALSE,
        'Test referral for updated structure verification',
        'medium',
        TRUE
    );
    
    RAISE NOTICE '✅ Test insert successful with new structure!';
    
    -- Clean up
    DELETE FROM referrals WHERE brief_description_of_concern = 'Test referral for updated structure verification';
    RAISE NOTICE '✅ Test data cleaned up';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test insert failed: %', SQLERRM;
    RAISE NOTICE 'Error details: %', SQLSTATE;
END $$;

-- 8. Show sample of how the new structure looks
SELECT 
    'New referrals table structure includes:' as info,
    'Referral source checkboxes (faculty, staff, parent, etc.)' as feature_1,
    'Counseling preference options (face-to-face, group, online)' as feature_2,
    'Detailed reason checkboxes (academic, behavioral, emotional, etc.)' as feature_3,
    'Brief description and immediate action fields' as feature_4,
    'Signature and approval fields' as feature_5;
