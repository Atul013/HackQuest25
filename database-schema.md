# Database Schema & API Design - Supabase (PostgreSQL)

## Database Tables

### 1. Venues Table
```sql
-- venues table (replaces "stations")
CREATE TABLE venues (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- railway_station, airport, concert, stadium, mall, hospital, etc.
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius INTEGER DEFAULT 500, -- meters
  qr_code TEXT,
  active BOOLEAN DEFAULT true,
  capacity INTEGER,
  opening_hours VARCHAR(100) DEFAULT '24/7',
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for geospatial queries
CREATE INDEX idx_venues_location ON venues (latitude, longitude);
CREATE INDEX idx_venues_type_active ON venues (type, active);
```

### 2. Subscriptions Table
```sql
-- subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_token TEXT NOT NULL,
  endpoint TEXT,
  p256dh_key TEXT,
  auth_key TEXT,
  venue_id VARCHAR(50) NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  venue_name VARCHAR(255) NOT NULL,
  venue_type VARCHAR(50) NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_in_geofence BOOLEAN DEFAULT false,
  registration_source VARCHAR(20) DEFAULT 'qr', -- qr, wifi, manual
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_venue_expires ON subscriptions (venue_id, expires_at);
CREATE INDEX idx_subscriptions_device_venue ON subscriptions (device_token, venue_id);
CREATE INDEX idx_subscriptions_active ON subscriptions (expires_at) WHERE expires_at > NOW();
```

### 3. Alerts Table
```sql
-- alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id VARCHAR(50) NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  venue_name VARCHAR(255) NOT NULL,
  venue_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  alert_type VARCHAR(50) DEFAULT 'announcement', -- emergency, announcement, update, warning
  severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  sent_count INTEGER DEFAULT 0,
  acknowledged_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_alerts_venue_active ON alerts (venue_id, active, created_at);
CREATE INDEX idx_alerts_type_severity ON alerts (alert_type, severity);
CREATE INDEX idx_alerts_active_expires ON alerts (active, expires_at);
```

### 4. Temporary Announcements Table 🆕
```sql
-- temporary_announcements table
-- Audio converted to text, auto-deleted after 10 minutes
CREATE TABLE temporary_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id VARCHAR(50) NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  venue_name VARCHAR(255) NOT NULL,
  venue_type VARCHAR(50) NOT NULL,
  audio_text TEXT NOT NULL,
  -- NO original audio stored - only text is kept
  language VARCHAR(10) DEFAULT 'en',
  confidence DECIMAL(3, 2) DEFAULT 0.95, -- speech-to-text confidence score
  detected_keywords TEXT[], -- PostgreSQL array of keywords
  announcement_type VARCHAR(50) DEFAULT 'general', -- delay, platform_change, boarding, general, emergency
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes', -- exactly 10 minutes after creation
  auto_delete_scheduled BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active', -- active, expired, deleted
  source VARCHAR(50) DEFAULT 'station_pa_system', -- station_pa_system, manual_upload, mobile_app
  processed_by VARCHAR(100) DEFAULT 'speech_to_text_service_v2',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance and cleanup
CREATE INDEX idx_temp_announcements_venue_status ON temporary_announcements (venue_id, status, expires_at);
CREATE INDEX idx_temp_announcements_cleanup ON temporary_announcements (expires_at, status) WHERE status = 'active';
CREATE INDEX idx_temp_announcements_type_priority ON temporary_announcements (announcement_type, priority);
```

## PostgreSQL Functions & Triggers

### Auto-Update Timestamps
```sql
-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_temp_announcements_updated_at BEFORE UPDATE ON temporary_announcements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Auto-Cleanup Function for Temporary Announcements
```sql
-- Function to automatically delete expired announcements
CREATE OR REPLACE FUNCTION cleanup_expired_announcements()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired announcements
    DELETE FROM temporary_announcements 
    WHERE expires_at < NOW() 
    AND status = 'active';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run every minute (using pg_cron extension)
-- You can also call this from your Node.js app with setInterval
SELECT cron.schedule('cleanup-announcements', '* * * * *', 'SELECT cleanup_expired_announcements();');
```

## API Endpoints

### Venue Management
```javascript
GET    /api/venues                // List all venues
GET    /api/venues/:id            // Get venue details
GET    /api/venues/type/:type     // Get venues by type (airports, concerts, etc.)
POST   /api/venues                // Add new venue (admin)
PUT    /api/venues/:id            // Update venue (admin)
```

### Subscription Management
```javascript
POST   /api/subscribe             // Register device for alerts
POST   /api/unsubscribe           // Remove subscription
PUT    /api/subscription/ping     // Update last seen / geofence status
```

### Alert Management
```javascript
GET    /api/alerts/:venueId       // Get active alerts for venue
POST   /api/alerts/send           // Send alert to venue (admin)
GET    /api/alerts/history        // Get alert history (admin)
GET    /api/alerts/type/:type     // Get alerts by type (emergency, announcement, etc.)
```

### Temporary Announcements API 🆕
```javascript
POST   /api/announcements/create          // Create new text announcement (from audio-to-text)
GET    /api/announcements/:venueId        // Get active announcements for venue
GET    /api/announcements/history/:venueId // Get announcement history (admin)
DELETE /api/announcements/:id             // Manual delete announcement
PUT    /api/announcements/:id/extend      // Extend expiry time (admin only)
```

### QR Code
```javascript
GET    /api/qr/:venueId           // Generate QR code for venue
```

## Sample SQL Queries

### Get Active Subscriptions for a Venue
```sql
SELECT * FROM subscriptions 
WHERE venue_id = 'CS001' 
AND expires_at > NOW();
```

### Get Active Announcements for a Venue
```sql
SELECT * FROM temporary_announcements 
WHERE venue_id = 'CS001' 
AND status = 'active' 
AND expires_at > NOW()
ORDER BY priority DESC, created_at DESC;
```

### Create New Announcement (from Audio-to-Text)
```sql
INSERT INTO temporary_announcements (
  venue_id, venue_name, venue_type, audio_text, 
  language, confidence, detected_keywords, 
  announcement_type, priority, source
) VALUES (
  'CS001', 'Central Station', 'railway_station',
  'Train number 12345 from Platform 3 to Mumbai is delayed by 15 minutes',
  'en', 0.95, 
  ARRAY['train', '12345', 'platform', '3', 'mumbai', 'delayed', '15', 'minutes'],
  'delay', 'medium', 'station_pa_system'
);
```

### Cleanup Expired Announcements
```sql
DELETE FROM temporary_announcements 
WHERE expires_at < NOW() 
AND status = 'active';
```

## Key Features

### Temporary Announcements System
- **Text-Only Storage**: No audio files stored, only converted text
- **10-Minute Auto-Delete**: Announcements automatically expire using PostgreSQL triggers
- **Smart Metadata**: Language detection, confidence scores, keywords (stored as PostgreSQL arrays)
- **Categorization**: Different announcement types (delay, platform_change, etc.)
- **Priority Levels**: Low, medium, high priority announcements
- **Source Tracking**: Know where the announcement came from

### Auto-Cleanup Mechanism
- Uses PostgreSQL pg_cron extension OR Node.js cron job
- Runs every minute to check for expired announcements
- Automatically deletes announcements after 10 minutes
- Cleanup query: `DELETE FROM temporary_announcements WHERE expires_at < NOW() AND status = 'active'`

### Announcement Flow
1. **Audio Capture**: Your teammates capture audio from PA system
2. **Speech-to-Text**: Convert audio to text using speech recognition
3. **Store Text**: Save only the text + metadata to Supabase PostgreSQL
4. **Auto-Expire**: System automatically deletes after 10 minutes
5. **User Notification**: Users receive temporary announcements

## Database Features (PostgreSQL/Supabase)

### Advantages over Firestore
- **SQL Queries**: Complex joins and aggregations
- **Triggers**: Automatic cleanup and updates
- **Array Support**: Store keywords as native PostgreSQL arrays
- **Performance**: Better for complex queries and reports
- **Cost**: More predictable pricing
- **Real-time**: Supabase real-time subscriptions

### Supabase Features Used
- **Real-time subscriptions**: Listen to table changes
- **Row Level Security (RLS)**: Instead of Firestore security rules
- **PostgREST API**: Auto-generated REST API
- **Edge Functions**: For serverless logic
- **Auth**: Built-in authentication system

## Environment Variables

### Backend (.env)
```env
PORT=3000
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:your_email@example.com

# Auth & Security
ADMIN_PASSWORD=hackathon2025
JWT_SECRET=your_jwt_secret

# Optional: Firebase for push notifications (if still using FCM)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CREDENTIALS=path_to_service_account.json
```

## Row Level Security (RLS) Policies

### Supabase RLS Policies (replaces Firestore security rules)
```sql
-- Enable RLS on all tables
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE temporary_announcements ENABLE ROW LEVEL SECURITY;

-- Venues: Read for everyone, write for admins only
CREATE POLICY "Venues are viewable by everyone" ON venues
  FOR SELECT USING (true);

CREATE POLICY "Venues are editable by admins" ON venues
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Subscriptions: Users can manage their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid()::text = device_token OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid()::text = device_token OR auth.jwt() ->> 'role' = 'admin');

-- Alerts: Read for everyone, write for admins
CREATE POLICY "Alerts are viewable by everyone" ON alerts
  FOR SELECT USING (true);

CREATE POLICY "Alerts are editable by admins" ON alerts
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Temporary Announcements: Read for everyone, write for admins
CREATE POLICY "Announcements are viewable by everyone" ON temporary_announcements
  FOR SELECT USING (true);

CREATE POLICY "Announcements are editable by admins" ON temporary_announcements
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

## Supabase Setup Steps

### 1. Create Supabase Project
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize project
supabase init

# Link to your project
supabase link --project-ref your-project-ref
```

### 2. Run Database Migrations
```bash
# Create migration file
supabase migration new create_tables

# Add the SQL schema to the migration file
# Then apply migrations
supabase db push
```

### 3. Install Dependencies
```bash
npm install @supabase/supabase-js
npm install express cors dotenv body-parser
npm install web-push qrcode
```