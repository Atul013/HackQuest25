-- Add venue_id column to transcriptions table
-- This links each transcription to a specific venue

-- Add venue_id column (references venues.id, not venues.venue_id)
ALTER TABLE transcriptions 
ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id) ON DELETE SET NULL;

-- Create index for faster venue-based queries
CREATE INDEX IF NOT EXISTS idx_transcriptions_venue_id ON transcriptions(venue_id);

-- Update RLS policy to allow filtering by venue
DROP POLICY IF EXISTS "Allow all operations on transcriptions" ON transcriptions;

CREATE POLICY "Allow all operations on transcriptions" ON transcriptions
    FOR ALL USING (true);

-- Comment
COMMENT ON COLUMN transcriptions.venue_id IS 'Foreign key linking transcription to a specific venue (references venues.id)';

-- Example: Update existing transcriptions to link to a venue (optional)
-- UPDATE transcriptions SET venue_id = (SELECT id FROM venues LIMIT 1) WHERE venue_id IS NULL;

-- Success message
SELECT 'Venue column added to transcriptions table successfully!' as status;
