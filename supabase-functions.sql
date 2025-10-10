-- PublicAlert Supabase-Only Database Functions
-- Run this in Supabase SQL Editor to replace Express server functionality

-- =================== ADMIN & AUTH FUNCTIONS ===================

-- Admin login function (replaces POST /api/admin/login)
CREATE OR REPLACE FUNCTION admin_login(password_input TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
    token TEXT;
BEGIN
    IF password_input = 'hackathon2025' THEN
        -- Generate simple token (in production, use JWT)
        token := 'admin_' || extract(epoch from now())::text;
        
        result := json_build_object(
            'success', true,
            'message', 'Login successful',
            'token', token,
            'role', 'admin',
            'expires_at', (NOW() + INTERVAL '24 hours')::timestamp
        );
    ELSE
        result := json_build_object(
            'success', false,
            'message', 'Invalid credentials',
            'error', 'Unauthorized'
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================== VENUE FUNCTIONS ===================

-- Create venue function (replaces POST /api/venues)
CREATE OR REPLACE FUNCTION create_venue(
    p_name TEXT,
    p_type TEXT,
    p_address TEXT,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_radius INTEGER DEFAULT 100,
    p_capacity INTEGER DEFAULT NULL,
    p_contact_info JSONB DEFAULT NULL,
    p_emergency_contacts JSONB DEFAULT NULL,
    p_facilities TEXT[] DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_venue_id UUID;
    result JSON;
BEGIN
    -- Validate venue type
    IF p_type NOT IN ('railway_station', 'airport', 'shopping_mall', 'concert_venue', 
                      'sports_stadium', 'hospital', 'university', 'office_building') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid venue type'
        );
    END IF;
    
    -- Insert new venue
    INSERT INTO venues (name, type, address, latitude, longitude, radius, capacity, 
                       contact_info, emergency_contacts, facilities, active)
    VALUES (p_name, p_type, p_address, p_latitude, p_longitude, p_radius, 
            p_capacity, p_contact_info, p_emergency_contacts, p_facilities, true)
    RETURNING id INTO new_venue_id;
    
    -- Return success with venue data
    SELECT json_build_object(
        'success', true,
        'venue', row_to_json(v.*)
    ) INTO result
    FROM venues v WHERE v.id = new_venue_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate QR code data function (replaces GET /api/venues/:id/qr)
CREATE OR REPLACE FUNCTION generate_venue_qr(venue_id_input UUID)
RETURNS JSON AS $$
DECLARE
    venue_record venues%ROWTYPE;
    qr_data TEXT;
    result JSON;
BEGIN
    -- Get venue details
    SELECT * INTO venue_record FROM venues WHERE id = venue_id_input AND active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Venue not found'
        );
    END IF;
    
    -- Generate QR data URL (you'll replace this domain with your actual PWA domain)
    qr_data := 'https://your-publicalert-app.vercel.app/venue/' || venue_id_input::text;
    
    result := json_build_object(
        'success', true,
        'venue_id', venue_record.id,
        'venue_name', venue_record.name,
        'qr_data', qr_data,
        'venue_type', venue_record.type,
        'instructions', 'Scan this QR code to receive emergency alerts for ' || venue_record.name
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================== SUBSCRIPTION FUNCTIONS ===================

-- Subscribe to venue function (replaces POST /api/subscriptions)
CREATE OR REPLACE FUNCTION subscribe_to_venue(
    p_venue_id UUID,
    p_device_token TEXT,
    p_notification_preferences JSONB DEFAULT '{"alerts": true, "announcements": true, "emergencies": true}'::jsonb
)
RETURNS JSON AS $$
DECLARE
    existing_sub_id UUID;
    new_sub_id UUID;
    venue_name TEXT;
    result JSON;
BEGIN
    -- Check if venue exists
    SELECT name INTO venue_name FROM venues WHERE id = p_venue_id AND active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Venue not found'
        );
    END IF;
    
    -- Check for existing subscription
    SELECT id INTO existing_sub_id 
    FROM subscriptions 
    WHERE venue_id = p_venue_id AND device_token = p_device_token;
    
    IF existing_sub_id IS NOT NULL THEN
        -- Update existing subscription
        UPDATE subscriptions 
        SET notification_preferences = p_notification_preferences,
            expires_at = NOW() + INTERVAL '24 hours',
            updated_at = NOW()
        WHERE id = existing_sub_id
        RETURNING id INTO new_sub_id;
        
        result := json_build_object(
            'success', true,
            'message', 'Subscription updated',
            'subscription_id', new_sub_id,
            'venue_name', venue_name,
            'expires_at', NOW() + INTERVAL '24 hours'
        );
    ELSE
        -- Create new subscription
        INSERT INTO subscriptions (venue_id, device_token, notification_preferences, expires_at)
        VALUES (p_venue_id, p_device_token, p_notification_preferences, NOW() + INTERVAL '24 hours')
        RETURNING id INTO new_sub_id;
        
        result := json_build_object(
            'success', true,
            'message', 'Subscribed successfully',
            'subscription_id', new_sub_id,
            'venue_name', venue_name,
            'expires_at', NOW() + INTERVAL '24 hours'
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unsubscribe function (replaces DELETE /api/subscriptions)
CREATE OR REPLACE FUNCTION unsubscribe_from_venue(
    p_venue_id UUID,
    p_device_token TEXT
)
RETURNS JSON AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM subscriptions 
    WHERE venue_id = p_venue_id AND device_token = p_device_token;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count > 0 THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Unsubscribed successfully'
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'Subscription not found'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================== ALERT FUNCTIONS ===================

-- Create alert function (replaces POST /api/alerts)
CREATE OR REPLACE FUNCTION create_alert(
    p_venue_id UUID,
    p_alert_type TEXT,
    p_severity TEXT,
    p_title TEXT,
    p_message TEXT,
    p_instructions TEXT DEFAULT NULL,
    p_affected_areas TEXT[] DEFAULT NULL,
    p_estimated_duration INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_alert_id UUID;
    subscriber_count INTEGER;
    venue_name TEXT;
    result JSON;
BEGIN
    -- Validate inputs
    IF p_alert_type NOT IN ('emergency', 'security', 'weather', 'transport', 'maintenance', 'medical') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid alert type');
    END IF;
    
    IF p_severity NOT IN ('critical', 'high', 'medium', 'low') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid severity level');
    END IF;
    
    -- Check venue exists
    SELECT name INTO venue_name FROM venues WHERE id = p_venue_id AND active = true;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Venue not found');
    END IF;
    
    -- Insert new alert
    INSERT INTO alerts (venue_id, alert_type, severity, title, message, instructions, 
                       affected_areas, estimated_duration, active)
    VALUES (p_venue_id, p_alert_type, p_severity, p_title, p_message, p_instructions, 
            p_affected_areas, p_estimated_duration, true)
    RETURNING id INTO new_alert_id;
    
    -- Count active subscribers for this venue
    SELECT COUNT(*) INTO subscriber_count
    FROM subscriptions 
    WHERE venue_id = p_venue_id AND expires_at > NOW();
    
    -- Return success result
    result := json_build_object(
        'success', true,
        'alert_id', new_alert_id,
        'venue_name', venue_name,
        'subscribers_count', subscriber_count,
        'severity', p_severity,
        'message', 'Alert created and will be broadcast to ' || subscriber_count || ' subscribers'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Deactivate alert function (replaces PATCH /api/alerts/:id/deactivate)
CREATE OR REPLACE FUNCTION deactivate_alert(alert_id_input UUID)
RETURNS JSON AS $$
DECLARE
    updated_count INTEGER;
    alert_title TEXT;
BEGIN
    UPDATE alerts 
    SET active = false, updated_at = NOW()
    WHERE id = alert_id_input AND active = true
    RETURNING title INTO alert_title;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    IF updated_count > 0 THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Alert deactivated: ' || alert_title
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'error', 'Alert not found or already inactive'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================== ANNOUNCEMENT FUNCTIONS ===================

-- Create temporary announcement function (replaces POST /api/announcements)
CREATE OR REPLACE FUNCTION create_announcement(
    p_venue_id UUID,
    p_transcribed_text TEXT,
    p_announcement_type TEXT DEFAULT 'general',
    p_priority TEXT DEFAULT 'medium',
    p_duration_minutes INTEGER DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
    new_announcement_id UUID;
    venue_name TEXT;
    expires_at_time TIMESTAMP WITH TIME ZONE;
    result JSON;
BEGIN
    -- Validate inputs
    IF p_announcement_type NOT IN ('general', 'transport', 'security', 'maintenance', 'emergency') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid announcement type');
    END IF;
    
    IF p_priority NOT IN ('high', 'medium', 'low') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid priority level');
    END IF;
    
    -- Check venue exists
    SELECT name INTO venue_name FROM venues WHERE id = p_venue_id AND active = true;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Venue not found');
    END IF;
    
    -- Calculate expiry time
    expires_at_time := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;
    
    -- Insert new announcement
    INSERT INTO temporary_announcements (
        venue_id, transcribed_text, announcement_type, priority, expires_at, status
    )
    VALUES (
        p_venue_id, p_transcribed_text, p_announcement_type, p_priority, expires_at_time, 'active'
    )
    RETURNING id INTO new_announcement_id;
    
    result := json_build_object(
        'success', true,
        'announcement_id', new_announcement_id,
        'venue_name', venue_name,
        'expires_at', expires_at_time,
        'duration_minutes', p_duration_minutes,
        'priority', p_priority,
        'message', 'Announcement created and will auto-expire in ' || p_duration_minutes || ' minutes'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================== UTILITY FUNCTIONS ===================

-- Get venue statistics
CREATE OR REPLACE FUNCTION get_venue_stats(venue_id_input UUID)
RETURNS JSON AS $$
DECLARE
    venue_name TEXT;
    active_alerts INTEGER;
    active_announcements INTEGER;
    total_subscribers INTEGER;
    result JSON;
BEGIN
    -- Get venue name
    SELECT name INTO venue_name FROM venues WHERE id = venue_id_input AND active = true;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Venue not found');
    END IF;
    
    -- Count active alerts
    SELECT COUNT(*) INTO active_alerts FROM alerts 
    WHERE venue_id = venue_id_input AND active = true;
    
    -- Count active announcements
    SELECT COUNT(*) INTO active_announcements FROM temporary_announcements 
    WHERE venue_id = venue_id_input AND status = 'active' AND expires_at > NOW();
    
    -- Count active subscribers
    SELECT COUNT(*) INTO total_subscribers FROM subscriptions 
    WHERE venue_id = venue_id_input AND expires_at > NOW();
    
    result := json_build_object(
        'success', true,
        'venue_id', venue_id_input,
        'venue_name', venue_name,
        'stats', json_build_object(
            'active_alerts', active_alerts,
            'active_announcements', active_announcements,
            'total_subscribers', total_subscribers,
            'last_updated', NOW()
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Manual cleanup function (can be called via API)
CREATE OR REPLACE FUNCTION manual_cleanup()
RETURNS JSON AS $$
DECLARE
    expired_announcements INTEGER;
    expired_subscriptions INTEGER;
BEGIN
    -- Expire old announcements
    UPDATE temporary_announcements 
    SET status = 'expired'
    WHERE expires_at < NOW() AND status = 'active';
    GET DIAGNOSTICS expired_announcements = ROW_COUNT;
    
    -- Delete expired subscriptions
    DELETE FROM subscriptions WHERE expires_at < NOW();
    GET DIAGNOSTICS expired_subscriptions = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'expired_announcements', expired_announcements,
        'expired_subscriptions', expired_subscriptions,
        'cleanup_time', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS JSON AS $$
DECLARE
    total_venues INTEGER;
    total_active_alerts INTEGER;
    total_subscribers INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_venues FROM venues WHERE active = true;
    SELECT COUNT(*) INTO total_active_alerts FROM alerts WHERE active = true;
    SELECT COUNT(*) INTO total_subscribers FROM subscriptions WHERE expires_at > NOW();
    
    RETURN json_build_object(
        'status', 'OK',
        'timestamp', NOW(),
        'database', 'Connected',
        'stats', json_build_object(
            'total_venues', total_venues,
            'active_alerts', total_active_alerts,
            'active_subscribers', total_subscribers
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT 'Supabase-Only Database Functions created successfully! 🎉' as status,
       'Your Express server is now replaced by PostgreSQL functions' as message;