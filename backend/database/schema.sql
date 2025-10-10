/**
 * Database Schema for Geofencing
 * PostgreSQL with PostGIS extension
 */

-- Enable PostGIS extension for geospatial operations
CREATE EXTENSION IF NOT EXISTS postgis;

-- Venues table with geofence configuration
CREATE TABLE venues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'railway', 'airport', 'concert', 'stadium', 'mall'
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  geofence_radius INTEGER DEFAULT 500, -- radius in meters
  geofence_polygon JSONB, -- custom polygon boundary [[lat,lon], ...]
  location GEOGRAPHY(POINT, 4326), -- PostGIS point for spatial queries
  wifi_ssid VARCHAR(100),
  wifi_enabled BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index on location
CREATE INDEX idx_venues_location ON venues USING GIST(location);

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255) UNIQUE NOT NULL,
  fcm_token VARCHAR(512), -- Firebase Cloud Messaging token
  device_type VARCHAR(20), -- 'android', 'ios', 'web'
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_device_id ON users(device_id);
CREATE INDEX idx_users_fcm_token ON users(fcm_token);

-- Subscriptions table (user-venue relationships)
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP, -- last time user was detected in geofence
  last_location GEOGRAPHY(POINT, 4326), -- last known location
  outside_since TIMESTAMP, -- when user first detected outside geofence
  active BOOLEAN DEFAULT true,
  unsubscribed_at TIMESTAMP,
  unsubscribe_reason VARCHAR(50), -- 'geofence_exit', 'manual', 'geofence_exit_timeout'
  expires_at TIMESTAMP,
  UNIQUE(user_id, venue_id)
);

CREATE INDEX idx_subscriptions_user_venue ON subscriptions(user_id, venue_id);
CREATE INDEX idx_subscriptions_active ON subscriptions(active) WHERE active = true;
CREATE INDEX idx_subscriptions_outside_since ON subscriptions(outside_since) WHERE outside_since IS NOT NULL;
CREATE INDEX idx_subscriptions_location ON subscriptions USING GIST(last_location);

-- Alerts table
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'emergency', 'warning', 'info', 'update'
  severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  category VARCHAR(50), -- 'fire', 'medical', 'security', 'weather'
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  acknowledged_count INTEGER DEFAULT 0
);

CREATE INDEX idx_alerts_venue_id ON alerts(venue_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_type ON alerts(type);

-- Alert logs (track delivery and acknowledgment)
CREATE TABLE alert_logs (
  id SERIAL PRIMARY KEY,
  alert_id INTEGER NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP,
  delivery_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  error_message TEXT
);

CREATE INDEX idx_alert_logs_alert_user ON alert_logs(alert_id, user_id);
CREATE INDEX idx_alert_logs_delivered ON alert_logs(delivered_at);

-- Location logs (for analytics and debugging)
CREATE TABLE location_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  accuracy DECIMAL(10, 2), -- accuracy in meters
  inside_geofences JSONB, -- array of venue IDs user is inside
  outside_geofences JSONB, -- array of venue IDs user is outside
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_location_logs_user_id ON location_logs(user_id);
CREATE INDEX idx_location_logs_logged_at ON location_logs(logged_at DESC);
CREATE INDEX idx_location_logs_location ON location_logs USING GIST(location);

-- Function to automatically update the location geography field
CREATE OR REPLACE FUNCTION update_location_geography()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for venues table
CREATE TRIGGER venue_location_update
BEFORE INSERT OR UPDATE ON venues
FOR EACH ROW
EXECUTE FUNCTION update_location_geography();

-- Trigger for location_logs table
CREATE TRIGGER location_log_geography_update
BEFORE INSERT ON location_logs
FOR EACH ROW
EXECUTE FUNCTION update_location_geography();

-- Function to find venues within radius
CREATE OR REPLACE FUNCTION find_nearby_venues(
  user_lat DECIMAL,
  user_lon DECIMAL,
  radius_meters INTEGER DEFAULT 1000
)
RETURNS TABLE (
  venue_id INTEGER,
  venue_name VARCHAR,
  distance_meters DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.name,
    ST_Distance(
      v.location,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)
    )::DECIMAL AS distance
  FROM venues v
  WHERE ST_DWithin(
    v.location,
    ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326),
    radius_meters
  )
  AND v.active = true
  ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

-- Function to check if point is within venue geofence
CREATE OR REPLACE FUNCTION is_inside_venue_geofence(
  venue_id_param INTEGER,
  user_lat DECIMAL,
  user_lon DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  venue_rec RECORD;
  user_point GEOGRAPHY;
  distance_meters DECIMAL;
BEGIN
  -- Get venue details
  SELECT * INTO venue_rec FROM venues WHERE id = venue_id_param;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Create user point
  user_point := ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326);
  
  -- Check if within radius
  distance_meters := ST_Distance(venue_rec.location, user_point);
  
  RETURN distance_meters <= venue_rec.geofence_radius;
END;
$$ LANGUAGE plpgsql;

-- Sample seed data for testing (Kochi, Kerala, India)
-- Using precise KML polygon geofences from Google Maps

-- Ernakulam Junction Railway Station (Precise KML boundary)
INSERT INTO venues (name, type, latitude, longitude, geofence_type, geofence_polygon, wifi_enabled, wifi_ssid) VALUES
  ('Ernakulam Junction Railway Station', 'railway', 9.9710, 76.2910, 'polygon',
   ST_GeomFromText('POLYGON((76.2899817 9.9742998, 76.2904496 9.9693476, 76.2903102 9.9691786, 76.290396 9.9685445, 76.2907393 9.9685234, 76.2917371 9.9657971, 76.292059 9.9657232, 76.2921341 9.9669172, 76.2919773 9.9686677, 76.2911941 9.9720914, 76.2904431 9.9743315, 76.2899817 9.9742998))', 4326),
   true, 'RailwayWiFi');

-- Cochin International Airport (Precise KML boundary - terminals and runways)
INSERT INTO venues (name, type, latitude, longitude, geofence_type, geofence_polygon, wifi_enabled, wifi_ssid) VALUES
  ('Cochin International Airport', 'airport', 10.1540, 76.3950, 'polygon',
   ST_GeomFromText('POLYGON((76.385748 10.159892, 76.3858338 10.1566815, 76.3828727 10.1546539, 76.3802549 10.1545272, 76.3804265 10.1486976, 76.4200803 10.1499649, 76.4195653 10.1545272, 76.4045879 10.1539358, 76.4044162 10.1568083, 76.4011117 10.1578221, 76.4005967 10.1603144, 76.385748 10.159892))', 4326),
   true, 'COK_Free_WiFi');

-- Lulu Mall (Precise KML boundary matching exact mall footprint)
INSERT INTO venues (name, type, latitude, longitude, geofence_type, geofence_polygon, wifi_enabled, wifi_ssid) VALUES
  ('Lulu Mall Kochi', 'mall', 10.0280, 76.3100, 'polygon',
   ST_GeomFromText('POLYGON((76.3069647 10.0305599, 76.3063425 10.027158, 76.3058275 10.0264184, 76.3066643 10.0252774, 76.3086599 10.0250027, 76.3098615 10.0265029, 76.3107842 10.0270101, 76.3120073 10.0257, 76.3130372 10.0258479, 76.3127583 10.0283835, 76.3099473 10.0300316, 76.3069647 10.0305599))', 4326),
   true, 'LuluMall_Guest');

-- Rajagiri School of Engineering & Technology (Precise KML boundary - 28 points)
INSERT INTO venues (name, type, latitude, longitude, geofence_type, geofence_polygon, wifi_enabled, wifi_ssid) VALUES
  ('Rajagiri School of Engineering & Technology', 'educational', 9.9935, 76.3580, 'polygon',
   ST_GeomFromText('POLYGON((76.3552391 9.994284, 76.3552435 9.9940852, 76.355104 9.9936414, 76.3551791 9.9932293, 76.3558228 9.9927327, 76.3561876 9.9924369, 76.3566811 9.9922256, 76.3572283 9.9919826, 76.3590908 9.9917059, 76.3597452 9.9917587, 76.3602066 9.9917164, 76.360507 9.9917481, 76.3605284 9.9920228, 76.3606679 9.9922342, 76.3607001 9.99253, 76.3608181 9.9928576, 76.3608932 9.9930583, 76.3607323 9.9930794, 76.3605714 9.9935655, 76.3602388 9.9936289, 76.3602173 9.9938508, 76.3598847 9.9939036, 76.3597989 9.9941149, 76.3598203 9.994844, 76.3590586 9.9944742, 76.3581574 9.994041, 76.3572454 9.9940938, 76.3552391 9.994284))', 4326),
   true, 'Rajagiri_Campus_WiFi');

-- Create admin user for testing
INSERT INTO users (device_id, device_type) VALUES
  ('admin-device-001', 'web');

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_venues_updated_at
BEFORE UPDATE ON venues
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
