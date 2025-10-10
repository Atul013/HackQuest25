-- PublicAlert Database Setup Script
-- Copy and paste this entire script into Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geospatial queries (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- =================== TABLES ===================

-- Venues table
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL CHECK (type IN (
        'railway_station', 'airport', 'shopping_mall', 'concert_venue', 
        'sports_stadium', 'hospital', 'university', 'office_building'
    )),
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius INTEGER NOT NULL DEFAULT 100, -- meters
    capacity INTEGER,
    contact_info JSONB,
    emergency_contacts JSONB,
    facilities TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    notification_preferences JSONB DEFAULT '{"alerts": true, "announcements": true, "emergencies": true}'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(venue_id, device_token)
);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'emergency', 'security', 'weather', 'transport', 'maintenance', 'medical'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    instructions TEXT,
    affected_areas TEXT[],
    estimated_duration INTEGER, -- minutes
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Temporary announcements table
CREATE TABLE temporary_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    transcribed_text TEXT NOT NULL,
    announcement_type VARCHAR(50) DEFAULT 'general' CHECK (announcement_type IN (
        'general', 'transport', 'security', 'maintenance', 'emergency'
    )),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================== INDEXES ===================

-- Venues indexes
CREATE INDEX idx_venues_type_active ON venues(type, active);
CREATE INDEX idx_venues_location ON venues USING GIST (ST_Point(longitude, latitude));

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_venue_expires ON subscriptions(venue_id, expires_at);
CREATE INDEX idx_subscriptions_device_venue ON subscriptions(device_token, venue_id);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);

-- Alerts indexes
CREATE INDEX idx_alerts_venue_active_created ON alerts(venue_id, active, created_at);
CREATE INDEX idx_alerts_type_severity ON alerts(alert_type, severity);
CREATE INDEX idx_alerts_active ON alerts(active);

-- Temporary announcements indexes
CREATE INDEX idx_temp_announcements_venue_status_expires ON temporary_announcements(venue_id, status, expires_at);
CREATE INDEX idx_temp_announcements_expires_at ON temporary_announcements(expires_at);
CREATE INDEX idx_temp_announcements_priority ON temporary_announcements(announcement_type, priority);

-- =================== TRIGGERS ===================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_temp_announcements_updated_at BEFORE UPDATE ON temporary_announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================== AUTO-CLEANUP FUNCTIONS ===================

-- Function to automatically expire old announcements
CREATE OR REPLACE FUNCTION cleanup_expired_announcements()
RETURNS void AS $$
BEGIN
    UPDATE temporary_announcements 
    SET status = 'expired'
    WHERE expires_at < NOW() AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to automatically cleanup expired subscriptions
CREATE OR REPLACE FUNCTION cleanup_expired_subscriptions()
RETURNS void AS $$
BEGIN
    DELETE FROM subscriptions 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =================== ROW LEVEL SECURITY ===================

-- Enable RLS on all tables
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE temporary_announcements ENABLE ROW LEVEL SECURITY;

-- Venues: Read for everyone, write for admins only
CREATE POLICY "Venues are viewable by everyone" ON venues
  FOR SELECT USING (true);

CREATE POLICY "Venues are editable by service role" ON venues
  FOR ALL USING (auth.role() = 'service_role');

-- Subscriptions: Read/write for everyone (controlled by app logic)
CREATE POLICY "Subscriptions are manageable by everyone" ON subscriptions
  FOR ALL USING (true);

-- Alerts: Read for everyone, write for service role
CREATE POLICY "Alerts are viewable by everyone" ON alerts
  FOR SELECT USING (true);

CREATE POLICY "Alerts are editable by service role" ON alerts
  FOR ALL USING (auth.role() = 'service_role');

-- Temporary Announcements: Read for everyone, write for service role
CREATE POLICY "Announcements are viewable by everyone" ON temporary_announcements
  FOR SELECT USING (true);

CREATE POLICY "Announcements are editable by service role" ON temporary_announcements
  FOR ALL USING (auth.role() = 'service_role');

-- =================== SAMPLE DATA ===================

-- Insert sample venue for testing
INSERT INTO venues (name, type, address, latitude, longitude, radius, capacity, contact_info, emergency_contacts, facilities) VALUES 
(
    'Central Railway Station',
    'railway_station',
    '123 Main Street, Downtown',
    40.7128,
    -74.0060,
    150,
    10000,
    '{"phone": "+1-555-0123", "website": "https://centralstation.com"}'::jsonb,
    '[{"name": "Security", "phone": "+1-555-0911"}, {"name": "Medical", "phone": "+1-555-0999"}]'::jsonb,
    ARRAY['wifi', 'restrooms', 'parking', 'food_court', 'information_desk']
);

-- Success message
SELECT 'PublicAlert database setup completed successfully! 🎉' as status;