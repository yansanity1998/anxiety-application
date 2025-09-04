-- Check referrals table structure and identify issues
-- Run this in your Supabase SQL Editor to see what's wrong

-- 1. Check if table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'referrals') 
        THEN '✅ Referrals table exists' 
        ELSE '❌ Referrals table does not exist' 
    END as table_status;

-- 2. If table exists, show its structure
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'referrals') THEN
        RAISE NOTICE 'Referrals table structure:';
        RAISE NOTICE '------------------------';
    END IF;
END $$;

-- 3. Show table columns and constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN 'FOREIGN KEY'
        WHEN tc.constraint_type = 'CHECK' THEN 'CHECK'
        ELSE ''
    END as constraint_type
FROM information_schema.columns c
LEFT JOIN information_schema.constraint_column_usage ccu ON c.column_name = ccu.column_name
LEFT JOIN information_schema.table_constraints tc ON ccu.constraint_name = tc.constraint_name
WHERE c.table_name = 'referrals'
ORDER BY c.ordinal_position;

-- 4. Show foreign key constraints
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

-- 5. Show check constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'referrals' AND tc.constraint_type = 'CHECK';

-- 6. Check RLS status
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

-- 7. Show policies
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

-- 8. Test basic insert (this will show any constraint violations)
DO $$
DECLARE
    test_student_id BIGINT;
    test_admin_id BIGINT;
BEGIN
    -- Get a sample student ID
    SELECT id INTO test_student_id FROM profiles WHERE role IN ('student', 'user') LIMIT 1;
    
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
    
    RAISE NOTICE 'Testing with student_id: %, admin_id: %', test_student_id, test_admin_id;
    
    -- Try to insert a test record
    INSERT INTO referrals (
        student_id, 
        referred_by, 
        psychiatrist_name, 
        psychiatrist_email, 
        referral_reason, 
        urgency_level
    ) VALUES (
        test_student_id,
        test_admin_id,
        'Dr. Test',
        'test@test.com',
        'Test referral',
        'medium'
    );
    
    RAISE NOTICE '✅ Test insert successful!';
    
    -- Clean up
    DELETE FROM referrals WHERE psychiatrist_email = 'test@test.com';
    RAISE NOTICE '✅ Test data cleaned up';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test insert failed: %', SQLERRM;
    RAISE NOTICE 'Error details: %', SQLSTATE;
END $$; 