-- ========================================
-- FIND YOUR ACTUAL VENUE IDs
-- ========================================
-- Run this first to see what venue IDs you actually have

SELECT 
    id,
    name,
    location_name,
    city
FROM venues
ORDER BY name;

-- This will show you the REAL venue IDs in your database
-- Copy these IDs and we'll update the test data to match!
