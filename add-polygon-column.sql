-- ========================================
-- Add Polygon Coordinates Column to Venues Table
-- Migration Script for HackQuest25
-- ========================================

-- Add the polygon_coordinates column to store complex venue boundaries
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS polygon_coordinates DECIMAL(10,8)[][] DEFAULT NULL;

-- Add unique constraint on venue name (needed for ON CONFLICT in inserts)
ALTER TABLE venues 
ADD CONSTRAINT venues_name_unique UNIQUE (name);

-- Add comment to explain the column
COMMENT ON COLUMN venues.polygon_coordinates IS 'Array of [latitude, longitude] coordinates forming a polygon boundary. Format: [[lat1,lon1], [lat2,lon2], ...]. First and last points must be identical to close the polygon.';

-- Note: We don't create a GiST index on polygon_coordinates because:
-- 1. PostgreSQL GiST doesn't support multi-dimensional numeric arrays
-- 2. Point-in-polygon checking is done client-side in JavaScript
-- 3. Spatial queries use the existing idx_venues_location index on lat/lon

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'venues' 
    AND column_name = 'polygon_coordinates';

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ polygon_coordinates column added!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'The venues table is now ready for polygon geofencing.';
    RAISE NOTICE 'You can now run kochi-venues-setup.sql';
    RAISE NOTICE '========================================';
END $$;
