-- ========================================
-- HackQuest25 - Kochi Venues Setup
-- 4 Geofenced Locations for Emergency Alerts
-- ========================================

-- Enable PostGIS extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ========================================
-- VENUE 1: Ernakulam Junction Railway Station
-- ========================================
-- Accurate coordinates from KML data
INSERT INTO venues (
    name,
    type,
    address,
    latitude,
    longitude,
    radius,
    capacity,
    polygon_coordinates,
    contact_info,
    emergency_contacts,
    facilities,
    active
) VALUES (
    'Ernakulam Junction Railway Station',
    'railway_station',
    'Ernakulam South, Kochi, Kerala 682016, India',
    9.9710, -- Centroid of actual polygon
    76.2910,
    300, -- 300 meter radius (fallback)
    NULL, -- Capacity not applicable
    ARRAY[
        ARRAY[9.9742998, 76.2899817],
        ARRAY[9.9693476, 76.2904496],
        ARRAY[9.9691786, 76.2903102],
        ARRAY[9.9685445, 76.290396],
        ARRAY[9.9685234, 76.2907393],
        ARRAY[9.9657971, 76.2917371],
        ARRAY[9.9657232, 76.292059],
        ARRAY[9.9669172, 76.2921341],
        ARRAY[9.9686677, 76.2919773],
        ARRAY[9.9720914, 76.2911941],
        ARRAY[9.9743315, 76.2904431],
        ARRAY[9.9742998, 76.2899817]
    ]::DECIMAL(10,8)[][], -- Actual KML polygon from Google Maps
    '{
        "phone": "+91-484-2363333",
        "email": "ernkulam@sr.railnet.gov.in",
        "helpline": "139"
    }'::jsonb,
    '{
        "railway_police": "+91-484-2370222",
        "medical_emergency": "108",
        "fire": "101"
    }'::jsonb,
    ARRAY[
        'Waiting rooms',
        'Ticket counters',
        'Platforms 1-7',
        'Food court',
        'WiFi available'
    ],
    true
) ON CONFLICT (name) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    radius = EXCLUDED.radius,
    polygon_coordinates = EXCLUDED.polygon_coordinates,
    updated_at = NOW();

-- ========================================
-- VENUE 2: Cochin International Airport
-- ========================================
-- Accurate coordinates from KML data
INSERT INTO venues (
    name,
    type,
    address,
    latitude,
    longitude,
    radius,
    capacity,
    polygon_coordinates,
    contact_info,
    emergency_contacts,
    facilities,
    active
) VALUES (
    'Cochin International Airport',
    'airport',
    'Nedumbassery, Kochi, Kerala 683111, India',
    10.1550, -- Centroid of actual polygon
    76.4000,
    800, -- 800 meter radius (fallback)
    NULL,
    ARRAY[
        ARRAY[10.159892, 76.385748],
        ARRAY[10.1566815, 76.3858338],
        ARRAY[10.1546539, 76.3828727],
        ARRAY[10.1545272, 76.3802549],
        ARRAY[10.1486976, 76.3804265],
        ARRAY[10.1499649, 76.4200803],
        ARRAY[10.1545272, 76.4195653],
        ARRAY[10.1539358, 76.4045879],
        ARRAY[10.1568083, 76.4044162],
        ARRAY[10.1578221, 76.4011117],
        ARRAY[10.1603144, 76.4005967],
        ARRAY[10.159892, 76.385748]
    ]::DECIMAL(10,8)[][], -- Actual KML polygon from Google Maps
    '{
        "phone": "+91-484-2610115",
        "email": "info@cial.aero",
        "helpline": "+91-484-2611011"
    }'::jsonb,
    '{
        "airport_police": "+91-484-2610300",
        "medical": "+91-484-2610424",
        "fire": "+91-484-2610200"
    }'::jsonb,
    ARRAY[
        'Terminal 1 (Domestic)',
        'Terminal 2 (International)',
        'Terminal 3 (Domestic)',
        'Duty-free shopping',
        'WiFi available',
        'Medical center'
    ],
    true
) ON CONFLICT (name) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    radius = EXCLUDED.radius,
    polygon_coordinates = EXCLUDED.polygon_coordinates,
    updated_at = NOW();

-- ========================================
-- VENUE 3: Lulu Mall Kochi
-- ========================================
-- Accurate coordinates from KML data
INSERT INTO venues (
    name,
    type,
    address,
    latitude,
    longitude,
    radius,
    capacity,
    polygon_coordinates,
    contact_info,
    emergency_contacts,
    facilities,
    active
) VALUES (
    'Lulu Mall Kochi',
    'shopping_mall',
    '34/1111, NH Bypass, Edappally, Kochi, Kerala 682024, India',
    10.0278, -- Centroid of actual polygon
    76.3090,
    400, -- 400 meter radius (fallback)
    25000, -- Daily visitor capacity
    ARRAY[
        ARRAY[10.0305599, 76.3069647],
        ARRAY[10.027158, 76.3063425],
        ARRAY[10.0264184, 76.3058275],
        ARRAY[10.0252774, 76.3066643],
        ARRAY[10.0250027, 76.3086599],
        ARRAY[10.0265029, 76.3098615],
        ARRAY[10.0270101, 76.3107842],
        ARRAY[10.0257, 76.3120073],
        ARRAY[10.0258479, 76.3130372],
        ARRAY[10.0283835, 76.3127583],
        ARRAY[10.0300316, 76.3099473],
        ARRAY[10.0305599, 76.3069647]
    ]::DECIMAL(10,8)[][], -- Actual KML polygon from Google Maps
    '{
        "phone": "+91-484-4089888",
        "email": "info@lulumall.in",
        "security": "+91-484-4089800"
    }'::jsonb,
    '{
        "security_control": "+91-484-4089800",
        "medical": "+91-484-4089850",
        "fire_emergency": "101",
        "police": "100"
    }'::jsonb,
    ARRAY[
        '215+ stores',
        '4 floors',
        'Food court',
        'Cinema (9 screens)',
        'Parking 2500+ vehicles',
        'Medical center',
        'Security 24/7'
    ],
    true
) ON CONFLICT (name) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    radius = EXCLUDED.radius,
    polygon_coordinates = EXCLUDED.polygon_coordinates,
    capacity = EXCLUDED.capacity,
    updated_at = NOW();

-- ========================================
-- VENUE 4: Rajagiri School of Engineering & Technology
-- ========================================
-- Accurate coordinates from KML data
INSERT INTO venues (
    name,
    type,
    address,
    latitude,
    longitude,
    radius,
    capacity,
    polygon_coordinates,
    contact_info,
    emergency_contacts,
    facilities,
    active
) VALUES (
    'Rajagiri School of Engineering & Technology',
    'university',
    'Rajagiri Valley, Kakkanad, Kochi, Kerala 682039, India',
    9.9935, -- Centroid of actual polygon
    76.3585,
    500, -- 500 meter radius (fallback)
    10000, -- Student capacity
    ARRAY[
        ARRAY[9.994284, 76.3552391],
        ARRAY[9.9940852, 76.3552435],
        ARRAY[9.9936414, 76.355104],
        ARRAY[9.9932293, 76.3551791],
        ARRAY[9.9927327, 76.3558228],
        ARRAY[9.9924369, 76.3561876],
        ARRAY[9.9922256, 76.3566811],
        ARRAY[9.9919826, 76.3572283],
        ARRAY[9.9917059, 76.3590908],
        ARRAY[9.9917587, 76.3597452],
        ARRAY[9.9917164, 76.3602066],
        ARRAY[9.9917481, 76.360507],
        ARRAY[9.9920228, 76.3605284],
        ARRAY[9.9922342, 76.3606679],
        ARRAY[9.99253, 76.3607001],
        ARRAY[9.9928576, 76.3608181],
        ARRAY[9.9930583, 76.3608932],
        ARRAY[9.9930794, 76.3607323],
        ARRAY[9.9935655, 76.3605714],
        ARRAY[9.9936289, 76.3602388],
        ARRAY[9.9938508, 76.3602173],
        ARRAY[9.9939036, 76.3598847],
        ARRAY[9.9941149, 76.3597989],
        ARRAY[9.994844, 76.3598203],
        ARRAY[9.9944742, 76.3590586],
        ARRAY[9.994041, 76.3581574],
        ARRAY[9.9940938, 76.3572454],
        ARRAY[9.994284, 76.3552391]
    ]::DECIMAL(10,8)[][], -- Actual KML polygon from Google Maps (28 points)
    '{
        "phone": "+91-484-2660324",
        "email": "principal@rajagiritech.ac.in",
        "website": "www.rajagiritech.ac.in"
    }'::jsonb,
    '{
        "campus_security": "+91-484-2660300",
        "medical_center": "+91-484-2660325",
        "fire": "101",
        "police": "100"
    }'::jsonb,
    ARRAY[
        'Engineering departments',
        'Library',
        'Hostels',
        'Sports facilities',
        'Medical center',
        'Cafeteria',
        'Auditorium',
        'WiFi campus-wide'
    ],
    true
) ON CONFLICT (name) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    radius = EXCLUDED.radius,
    polygon_coordinates = EXCLUDED.polygon_coordinates,
    capacity = EXCLUDED.capacity,
    updated_at = NOW();

-- ========================================
-- Create indexes for efficient geospatial queries
-- ========================================

-- Index on active venues
CREATE INDEX IF NOT EXISTS idx_venues_active ON venues(active) WHERE active = true;

-- Spatial index on location (for distance queries)
CREATE INDEX IF NOT EXISTS idx_venues_location 
    ON venues USING GIST (ST_MakePoint(longitude, latitude));

-- Index on venue type
CREATE INDEX IF NOT EXISTS idx_venues_type ON venues(type);

-- ========================================
-- Verify insertions
-- ========================================

SELECT 
    name,
    type,
    latitude,
    longitude,
    radius,
    CASE 
        WHEN polygon_coordinates IS NOT NULL THEN 'Polygon'
        ELSE 'Circle'
    END as geofence_type,
    active
FROM venues
WHERE active = true
ORDER BY name;

-- ========================================
-- Test Query: Find venues near a point
-- ========================================

-- Example: Find all venues within 1km of Ernakulam Junction
SELECT 
    name,
    type,
    ST_Distance(
        ST_MakePoint(longitude, latitude)::geography,
        ST_MakePoint(76.2999, 9.9816)::geography
    ) as distance_meters
FROM venues
WHERE active = true
    AND ST_DWithin(
        ST_MakePoint(longitude, latitude)::geography,
        ST_MakePoint(76.2999, 9.9816)::geography,
        1000 -- 1km radius
    )
ORDER BY distance_meters;

-- ========================================
-- Success Message
-- ========================================

DO $$ 
BEGIN 
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ All 4 Kochi venues configured!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. Ernakulam Junction Railway Station';
    RAISE NOTICE '2. Cochin International Airport';
    RAISE NOTICE '3. Lulu Mall Kochi';
    RAISE NOTICE '4. Rajagiri School of Engineering & Technology';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Geofencing is now active!';
    RAISE NOTICE '========================================';
END $$;
