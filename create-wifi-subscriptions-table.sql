-- ========================================
-- Create WiFi Subscriptions Table
-- For WiFi Portal User Registrations
-- ========================================

-- Drop existing wifi_subscriptions table if it exists (be careful in production!)
DROP TABLE IF EXISTS wifi_subscriptions CASCADE;

-- Create wifi_subscriptions table with all required fields
CREATE TABLE wifi_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL UNIQUE,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    last_latitude DECIMAL(10, 8),
    last_longitude DECIMAL(11, 8),
    location_accuracy DECIMAL(10, 2),
    registered_at TIMESTAMP WITH TIME ZONE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT true,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_wifi_subscriptions_phone ON wifi_subscriptions(phone);
CREATE INDEX IF NOT EXISTS idx_wifi_subscriptions_active ON wifi_subscriptions(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_wifi_subscriptions_venue ON wifi_subscriptions(venue_id) WHERE venue_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wifi_subscriptions_last_seen ON wifi_subscriptions(last_seen DESC);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_wifi_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wifi_subscriptions_updated_at
    BEFORE UPDATE ON wifi_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_wifi_subscriptions_updated_at();

-- Enable Row Level Security
ALTER TABLE wifi_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow anonymous inserts (for WiFi registration)
CREATE POLICY "Allow anonymous inserts" ON wifi_subscriptions
    FOR INSERT
    WITH CHECK (true);

-- Allow anonymous selects (for checking existing users)
CREATE POLICY "Allow anonymous selects" ON wifi_subscriptions
    FOR SELECT
    USING (true);

-- Allow anonymous updates (for location updates)
CREATE POLICY "Allow anonymous updates" ON wifi_subscriptions
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Verify table creation
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'wifi_subscriptions'
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ wifi_subscriptions table created!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Columns:';
    RAISE NOTICE '  - id (UUID)';
    RAISE NOTICE '  - phone (VARCHAR, UNIQUE)';
    RAISE NOTICE '  - language (VARCHAR)';
    RAISE NOTICE '  - last_latitude (DECIMAL)';
    RAISE NOTICE '  - last_longitude (DECIMAL)';
    RAISE NOTICE '  - location_accuracy (DECIMAL)';
    RAISE NOTICE '  - registered_at (TIMESTAMP)';
    RAISE NOTICE '  - last_seen (TIMESTAMP)';
    RAISE NOTICE '  - active (BOOLEAN)';
    RAISE NOTICE '  - venue_id (UUID, FK to venues)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS Policies: ✅ Enabled';
    RAISE NOTICE 'Indexes: ✅ Created';
    RAISE NOTICE 'Triggers: ✅ Created';
    RAISE NOTICE '========================================';
END $$;
