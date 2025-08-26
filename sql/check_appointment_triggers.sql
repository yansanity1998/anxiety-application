-- Check for any triggers or functions that might be referencing a notifications table
-- This will help identify the source of the "relation 'notifications' does not exist" error

-- Check for triggers on the appointments table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'appointments';

-- Check for functions that might be called by triggers
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%notifications%'
   OR routine_definition LIKE '%notification%';

-- Check for any foreign key constraints that might reference notifications
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (ccu.table_name LIKE '%notification%' OR tc.table_name LIKE '%notification%');

-- Check for any views that might reference notifications
SELECT 
    table_name,
    view_definition
FROM information_schema.views 
WHERE view_definition LIKE '%notifications%'
   OR view_definition LIKE '%notification%';

-- Check for any policies that might reference notifications
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
WHERE qual LIKE '%notifications%'
   OR with_check LIKE '%notifications%'
   OR policyname LIKE '%notification%';

-- Check if there are any sequences or other objects named notifications
SELECT 
    schemaname,
    tablename,
    tabletype
FROM pg_tables 
WHERE tablename LIKE '%notification%';

-- Check for any materialized views
SELECT 
    schemaname,
    matviewname
FROM pg_matviews 
WHERE matviewname LIKE '%notification%'; 