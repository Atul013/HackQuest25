-- ========================================
-- FIX: Add Foreign Key Relationship
-- ========================================
-- This adds the missing foreign key constraint so Supabase can JOIN tables

-- First, check if the column exists
-- If venue_id doesn't exist, uncomment this:
-- ALTER TABLE transcriptions ADD COLUMN venue_id UUID;

-- Add the foreign key constraint
ALTER TABLE transcriptions 
ADD CONSTRAINT transcriptions_venue_id_fkey 
FOREIGN KEY (venue_id) 
REFERENCES venues(id) 
ON DELETE SET NULL;

-- Verify the constraint was added
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conname = 'transcriptions_venue_id_fkey';

-- ========================================
-- Now test the relationship works
-- ========================================
SELECT 
    t.id,
    t.transcription_text,
    v.name as venue_name
FROM transcriptions t
LEFT JOIN venues v ON t.venue_id = v.id
LIMIT 5;
