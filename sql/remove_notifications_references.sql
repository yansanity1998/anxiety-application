-- Remove any database objects that reference a notifications table
-- This will help eliminate the "relation 'notifications' does not exist" error

-- First, let's check what exists
SELECT 'Checking for notifications references...' as status;

-- Check for any triggers that might reference notifications
SELECT 
    'TRIGGER' as object_type,
    trigger_name as object_name,
    event_object_table as table_name,
    action_statement as definition
FROM information_schema.triggers 
WHERE action_statement LIKE '%notifications%'
   OR action_statement LIKE '%notification%';

-- Check for any functions that might reference notifications
SELECT 
    'FUNCTION' as object_type,
    routine_name as object_name,
    routine_schema as schema_name,
    routine_definition as definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%notifications%'
   OR routine_definition LIKE '%notification%';

-- Check for any views that might reference notifications
SELECT 
    'VIEW' as object_type,
    table_name as object_name,
    table_schema as schema_name,
    view_definition as definition
FROM information_schema.views 
WHERE view_definition LIKE '%notifications%'
   OR view_definition LIKE '%notification%';

-- Check for any policies that might reference notifications
SELECT 
    'POLICY' as object_type,
    policyname as object_name,
    tablename as table_name,
    qual as using_clause,
    with_check as check_clause
FROM pg_policies 
WHERE qual LIKE '%notifications%'
   OR with_check LIKE '%notifications%'
   OR policyname LIKE '%notification%';

-- Check for any foreign key constraints that might reference notifications
SELECT 
    'FOREIGN KEY' as object_type,
    tc.constraint_name as object_name,
    tc.table_name as table_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (ccu.table_name LIKE '%notification%' OR tc.table_name LIKE '%notification%');

-- Now let's remove any problematic objects we found

-- Drop any triggers that reference notifications
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers 
        WHERE action_statement LIKE '%notifications%'
           OR action_statement LIKE '%notification%'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_record.trigger_name) || ' ON ' || quote_ident(trigger_record.event_object_table);
        RAISE NOTICE 'Dropped trigger % on table %', trigger_record.trigger_name, trigger_record.event_object_table;
    END LOOP;
END $$;

-- Drop any functions that reference notifications
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT routine_name, routine_schema
        FROM information_schema.routines 
        WHERE routine_definition LIKE '%notifications%'
           OR routine_definition LIKE '%notification%'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(func_record.routine_schema) || '.' || quote_ident(func_record.routine_name) || ' CASCADE';
        RAISE NOTICE 'Dropped function %', func_record.routine_name;
    END LOOP;
END $$;

-- Drop any views that reference notifications
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT table_name, table_schema
        FROM information_schema.views 
        WHERE view_definition LIKE '%notifications%'
           OR view_definition LIKE '%notification%'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(view_record.table_schema) || '.' || quote_ident(view_record.table_name) || ' CASCADE';
        RAISE NOTICE 'Dropped view %', view_record.table_name;
    END LOOP;
END $$;

-- Drop any policies that reference notifications
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename, schemaname
        FROM pg_policies 
        WHERE qual LIKE '%notifications%'
           OR with_check LIKE '%notifications%'
           OR policyname LIKE '%notification%'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON ' || quote_ident(policy_record.schemaname) || '.' || quote_ident(policy_record.tablename);
        RAISE NOTICE 'Dropped policy % on table %', policy_record.policyname, policy_record.tablename;
    END LOOP;
END $$;

-- Check if there are any remaining references
SELECT 'Checking for remaining notifications references...' as status;

SELECT 
    'REMAINING TRIGGER' as object_type,
    trigger_name as object_name,
    event_object_table as table_name
FROM information_schema.triggers 
WHERE action_statement LIKE '%notifications%'
   OR action_statement LIKE '%notification%';

SELECT 
    'REMAINING FUNCTION' as object_type,
    routine_name as object_name,
    routine_schema as schema_name
FROM information_schema.routines 
WHERE routine_definition LIKE '%notifications%'
   OR routine_definition LIKE '%notification%';

SELECT 
    'REMAINING VIEW' as object_type,
    table_name as object_name,
    table_schema as schema_name
FROM information_schema.views 
WHERE view_definition LIKE '%notifications%'
   OR view_definition LIKE '%notification%';

SELECT 
    'REMAINING POLICY' as object_type,
    policyname as object_name,
    tablename as table_name
FROM pg_policies 
WHERE qual LIKE '%notifications%'
   OR with_check LIKE '%notifications%'
   OR policyname LIKE '%notification%';

SELECT 'Cleanup complete. Try creating an appointment now.' as status; 