-- Update todo_items table to remove pending status
-- Run this in Supabase SQL Editor

-- First, update any existing pending todos to in_progress
UPDATE todo_items 
SET status = 'in_progress' 
WHERE status = 'pending';

-- Drop the existing constraint
ALTER TABLE todo_items 
DROP CONSTRAINT IF EXISTS todo_items_status_check;

-- Add the new constraint without pending
ALTER TABLE todo_items 
ADD CONSTRAINT todo_items_status_check 
CHECK (status IN ('in_progress','completed','canceled'));

-- Update the default status from pending to in_progress
ALTER TABLE todo_items 
ALTER COLUMN status SET DEFAULT 'in_progress'; 