# PublicAlert - Supabase-Only Architecture

## 🚀 **No Backend Server Needed!**

Instead of running a local Express server, we can use Supabase's built-in features:

### **1. Database Functions (Replace Express Routes)**

```sql
-- Create admin login function
CREATE OR REPLACE FUNCTION admin_login(password_input TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    IF password_input = 'hackathon2025' THEN
        result := json_build_object(
            'success', true,
            'message', 'Login successful',
            'token', 'admin_' || extract(epoch from now())
        );
    ELSE
        result := json_build_object(
            'success', false,
            'message', 'Invalid credentials'
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create alert broadcast function
CREATE OR REPLACE FUNCTION create_alert(
    p_venue_id UUID,
    p_alert_type TEXT,
    p_severity TEXT,
    p_title TEXT,
    p_message TEXT,
    p_instructions TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_alert_id UUID;
    subscriber_count INTEGER;
BEGIN
    -- Insert new alert
    INSERT INTO alerts (venue_id, alert_type, severity, title, message, instructions)
    VALUES (p_venue_id, p_alert_type, p_severity, p_title, p_message, p_instructions)
    RETURNING id INTO new_alert_id;
    
    -- Count active subscribers
    SELECT COUNT(*) INTO subscriber_count
    FROM subscriptions 
    WHERE venue_id = p_venue_id AND expires_at > NOW();
    
    -- Return result
    RETURN json_build_object(
        'success', true,
        'alert_id', new_alert_id,
        'subscribers_notified', subscriber_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create temporary announcement function
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
BEGIN
    INSERT INTO temporary_announcements (
        venue_id, 
        transcribed_text, 
        announcement_type, 
        priority,
        expires_at
    )
    VALUES (
        p_venue_id, 
        p_transcribed_text, 
        p_announcement_type, 
        p_priority,
        NOW() + (p_duration_minutes || ' minutes')::INTERVAL
    )
    RETURNING id INTO new_announcement_id;
    
    RETURN json_build_object(
        'success', true,
        'announcement_id', new_announcement_id,
        'expires_at', NOW() + (p_duration_minutes || ' minutes')::INTERVAL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **2. Edge Functions (Replace Express Server)**

Create `supabase/functions/alerts/index.ts`:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { venue_id, alert_type, severity, title, message } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Create alert using database function
  const { data, error } = await supabase.rpc('create_alert', {
    p_venue_id: venue_id,
    p_alert_type: alert_type,
    p_severity: severity,
    p_title: title,
    p_message: message
  })
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### **3. Frontend Direct Connection**

```javascript
// frontend/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://akblmbpxxotmebzghczj.supabase.co'
const supabaseAnonKey = 'your_anon_key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Direct API calls (no Express server needed!)
export async function createAlert(alertData) {
  const { data, error } = await supabase.rpc('create_alert', alertData)
  return { data, error }
}

export async function getVenueAlerts(venueId) {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('venue_id', venueId)
    .eq('active', true)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

// Real-time subscriptions
export function subscribeToAlerts(venueId, callback) {
  return supabase
    .channel('alerts')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'alerts',
      filter: `venue_id=eq.${venueId}`
    }, callback)
    .subscribe()
}
```

## ⚡ **Advantages of Supabase-Only:**

1. **🚀 Faster Development** - No server setup/maintenance
2. **💰 Cost Effective** - No server hosting costs
3. **🔄 Real-time Built-in** - WebSocket connections included
4. **📈 Auto-scaling** - Supabase handles traffic spikes
5. **🛡️ Security** - RLS policies handle permissions
6. **🌐 Global CDN** - Faster API responses worldwide

## ⚠️ **Trade-offs:**

1. **🔔 Push Notifications** - Need external service (OneSignal, FCM)
2. **🧮 Complex Logic** - Limited to PostgreSQL functions
3. **🔗 Third-party APIs** - Need Edge Functions for external calls
4. **🎛️ Control** - Less flexibility than custom server

## 🤔 **Recommendation for Your Hackathon:**

**Go Supabase-only!** Here's why:
- ✅ **24-hour timeline** - Save 2-3 hours of server setup
- ✅ **Demo-friendly** - No local server dependencies
- ✅ **Real-time features** - Built-in live updates
- ✅ **Easy deployment** - Frontend-only deployment needed

Would you like me to:
1. **Convert your current setup** to Supabase-only architecture?
2. **Keep the local server** for full control and complex logic?
3. **Show you both approaches** so you can choose?