-- WiFi Subscriptions Table for AlertNet
-- This table stores all users who register through the WiFi portal

CREATE TABLE IF NOT EXISTS wifi_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Phone Information
    phone VARCHAR(20) NOT NULL UNIQUE,  -- Full phone with country code (e.g., +915588936954)
    country_code VARCHAR(10),            -- Country code only (e.g., +91)
    phone_number VARCHAR(20),            -- Phone without country code (e.g., 5588936954)
    
    -- User Preferences
    language VARCHAR(10) DEFAULT 'en',  -- ISO 639-1 language code
    location_tracking BOOLEAN DEFAULT false,
    background_alerts BOOLEAN DEFAULT false,
    
    -- Location Data
    last_latitude DECIMAL(10, 8),       -- Last known latitude
    last_longitude DECIMAL(11, 8),      -- Last known longitude
    location_accuracy DECIMAL(10, 2),   -- GPS accuracy in meters
    
    -- Venue Association
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    
    -- Timestamps
    registered_at TIMESTAMP,            -- When user first registered
    last_seen TIMESTAMP DEFAULT NOW(),  -- Last time user was seen
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Status
    active BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wifi_subscriptions_phone ON wifi_subscriptions(phone);
CREATE INDEX IF NOT EXISTS idx_wifi_subscriptions_venue ON wifi_subscriptions(venue_id);
CREATE INDEX IF NOT EXISTS idx_wifi_subscriptions_active ON wifi_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_wifi_subscriptions_last_seen ON wifi_subscriptions(last_seen);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wifi_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_wifi_subscriptions_updated_at_trigger ON wifi_subscriptions;
CREATE TRIGGER update_wifi_subscriptions_updated_at_trigger
    BEFORE UPDATE ON wifi_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_wifi_subscriptions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE wifi_subscriptions IS 'Stores user registrations from the WiFi portal with location and preferences';
COMMENT ON COLUMN wifi_subscriptions.phone IS 'Full phone number with country code (unique identifier)';
COMMENT ON COLUMN wifi_subscriptions.location_tracking IS 'Whether user granted location tracking permission';
COMMENT ON COLUMN wifi_subscriptions.background_alerts IS 'Whether user granted background notification permission';
COMMENT ON COLUMN wifi_subscriptions.venue_id IS 'Associated venue if user is within a geofence';

-- Grant permissions (adjust based on your setup)
-- For anon key (public inserts/updates)
GRANT SELECT, INSERT, UPDATE ON wifi_subscriptions TO anon;
GRANT SELECT, INSERT, UPDATE ON wifi_subscriptions TO authenticated;

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE wifi_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to insert their own subscriptions
CREATE POLICY "Allow anonymous insert" ON wifi_subscriptions
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Policy: Allow users to update their own subscriptions by phone
CREATE POLICY "Allow update own subscription" ON wifi_subscriptions
    FOR UPDATE
    TO anon
    USING (true);  -- In production, add phone number validation

-- Policy: Allow reading subscriptions (for admin dashboard)
CREATE POLICY "Allow read subscriptions" ON wifi_subscriptions
    FOR SELECT
    TO authenticated
    USING (true);

-- Optional: View for analytics
CREATE OR REPLACE VIEW wifi_subscription_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN active = true THEN 1 END) as active_users,
    COUNT(CASE WHEN location_tracking = true THEN 1 END) as users_with_location,
    COUNT(CASE WHEN background_alerts = true THEN 1 END) as users_with_background,
    COUNT(DISTINCT venue_id) as venues_with_users,
    COUNT(CASE WHEN last_seen > NOW() - INTERVAL '1 day' THEN 1 END) as users_last_24h,
    COUNT(CASE WHEN last_seen > NOW() - INTERVAL '7 days' THEN 1 END) as users_last_7days
FROM wifi_subscriptions;

-- Sample query to get recent registrations
-- SELECT * FROM wifi_subscriptions ORDER BY created_at DESC LIMIT 10;

-- Sample query to get users in a specific venue
-- SELECT * FROM wifi_subscriptions WHERE venue_id = 'your-venue-id' AND active = true;

-- Sample query to get users with location tracking enabled
-- SELECT * FROM wifi_subscriptions WHERE location_tracking = true AND active = true;
