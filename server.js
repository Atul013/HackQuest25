const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configure Web Push
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://your-frontend-domain.com'],
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Auth middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { role: 'admin', timestamp: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, message: 'Login successful' });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =================== VENUES API ===================

// Get all venues
app.get('/api/venues', async (req, res) => {
  try {
    const { data: venues, error } = await supabase
      .from('venues')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;

    res.json(venues);
  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// Get venue by ID
app.get('/api/venues/:id', async (req, res) => {
  try {
    const { data: venue, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json(venue);
  } catch (error) {
    console.error('Get venue error:', error);
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

// Create venue (Admin only)
app.post('/api/venues', authenticateAdmin, async (req, res) => {
  try {
    const {
      name,
      type,
      address,
      latitude,
      longitude,
      radius,
      capacity,
      contactInfo,
      emergencyContacts,
      facilities
    } = req.body;

    // Validate required fields
    if (!name || !type || !address || !latitude || !longitude || !radius) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: venue, error } = await supabase
      .from('venues')
      .insert([{
        name,
        type,
        address,
        latitude,
        longitude,
        radius,
        capacity,
        contact_info: contactInfo,
        emergency_contacts: emergencyContacts,
        facilities,
        active: true
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(venue);
  } catch (error) {
    console.error('Create venue error:', error);
    res.status(500).json({ error: 'Failed to create venue' });
  }
});

// Update venue (Admin only)
app.put('/api/venues/:id', authenticateAdmin, async (req, res) => {
  try {
    const { data: venue, error } = await supabase
      .from('venues')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json(venue);
  } catch (error) {
    console.error('Update venue error:', error);
    res.status(500).json({ error: 'Failed to update venue' });
  }
});

// Generate QR code for venue
app.get('/api/venues/:id/qr', async (req, res) => {
  try {
    const { data: venue, error } = await supabase
      .from('venues')
      .select('id, name')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Generate QR code data (URL to PWA with venue ID)
    const qrData = `https://your-app-domain.com/venue/${venue.id}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({
      venueId: venue.id,
      venueName: venue.name,
      qrCode: qrCodeDataURL,
      qrData: qrData
    });
  } catch (error) {
    console.error('Generate QR error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// =================== SUBSCRIPTIONS API ===================

// Subscribe to venue notifications
app.post('/api/subscriptions', async (req, res) => {
  try {
    const { venueId, deviceToken, notificationPreferences } = req.body;

    if (!venueId || !deviceToken) {
      return res.status(400).json({ error: 'venueId and deviceToken are required' });
    }

    // Check if venue exists
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id')
      .eq('id', venueId)
      .single();

    if (venueError || !venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Check if subscription already exists
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('venue_id', venueId)
      .eq('device_token', deviceToken)
      .single();

    let subscription;
    if (existingSubscription) {
      // Update existing subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          notification_preferences: notificationPreferences,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        })
        .eq('id', existingSubscription.id)
        .select()
        .single();

      if (error) throw error;
      subscription = data;
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([{
          venue_id: venueId,
          device_token: deviceToken,
          notification_preferences: notificationPreferences,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        }])
        .select()
        .single();

      if (error) throw error;
      subscription = data;
    }

    res.status(201).json(subscription);
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Unsubscribe from venue notifications
app.delete('/api/subscriptions', async (req, res) => {
  try {
    const { venueId, deviceToken } = req.body;

    if (!venueId || !deviceToken) {
      return res.status(400).json({ error: 'venueId and deviceToken are required' });
    }

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('venue_id', venueId)
      .eq('device_token', deviceToken);

    if (error) throw error;

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// Get user's subscriptions
app.get('/api/subscriptions/:deviceToken', async (req, res) => {
  try {
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        venues (id, name, type, address)
      `)
      .eq('device_token', req.params.deviceToken)
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    res.json(subscriptions);
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// =================== ALERTS API ===================

// Get active alerts for venue
app.get('/api/venues/:venueId/alerts', async (req, res) => {
  try {
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('venue_id', req.params.venueId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Create alert (Admin only)
app.post('/api/alerts', authenticateAdmin, async (req, res) => {
  try {
    const {
      venueId,
      alertType,
      severity,
      title,
      message,
      instructions,
      affectedAreas,
      estimatedDuration
    } = req.body;

    if (!venueId || !alertType || !severity || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create alert
    const { data: alert, error } = await supabase
      .from('alerts')
      .insert([{
        venue_id: venueId,
        alert_type: alertType,
        severity,
        title,
        message,
        instructions,
        affected_areas: affectedAreas,
        estimated_duration: estimatedDuration,
        active: true
      }])
      .select()
      .single();

    if (error) throw error;

    // Send push notifications to subscribers
    await sendAlertNotifications(venueId, alert);

    res.status(201).json(alert);
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Update alert (Admin only)
app.put('/api/alerts/:id', authenticateAdmin, async (req, res) => {
  try {
    const { data: alert, error } = await supabase
      .from('alerts')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Deactivate alert (Admin only)
app.patch('/api/alerts/:id/deactivate', authenticateAdmin, async (req, res) => {
  try {
    const { data: alert, error } = await supabase
      .from('alerts')
      .update({ active: false })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Deactivate alert error:', error);
    res.status(500).json({ error: 'Failed to deactivate alert' });
  }
});

// =================== TEMPORARY ANNOUNCEMENTS API ===================

// Get active announcements for venue
app.get('/api/venues/:venueId/announcements', async (req, res) => {
  try {
    const { data: announcements, error } = await supabase
      .from('temporary_announcements')
      .select('*')
      .eq('venue_id', req.params.venueId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(announcements);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Create temporary announcement from audio-to-text (Admin only)
app.post('/api/announcements', authenticateAdmin, async (req, res) => {
  try {
    const {
      venueId,
      transcribedText,
      announcementType = 'general',
      priority = 'medium',
      durationMinutes = 10
    } = req.body;

    if (!venueId || !transcribedText) {
      return res.status(400).json({ error: 'venueId and transcribedText are required' });
    }

    // Create announcement with auto-expiry
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    
    const { data: announcement, error } = await supabase
      .from('temporary_announcements')
      .insert([{
        venue_id: venueId,
        transcribed_text: transcribedText,
        announcement_type: announcementType,
        priority,
        expires_at: expiresAt,
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;

    // Send push notifications for high priority announcements
    if (priority === 'high') {
      await sendAnnouncementNotifications(venueId, announcement);
    }

    res.status(201).json(announcement);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// =================== PUSH NOTIFICATION HELPERS ===================

async function sendAlertNotifications(venueId, alert) {
  try {
    // Get active subscriptions for the venue
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('device_token, notification_preferences')
      .eq('venue_id', venueId)
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    const notifications = subscriptions.map(subscription => {
      const payload = JSON.stringify({
        title: `🚨 ${alert.severity.toUpperCase()}: ${alert.title}`,
        body: alert.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: {
          alertId: alert.id,
          venueId: alert.venue_id,
          type: 'alert',
          severity: alert.severity
        }
      });

      return webpush.sendNotification({
        endpoint: subscription.device_token,
        keys: subscription.notification_preferences?.keys || {}
      }, payload);
    });

    await Promise.allSettled(notifications);
    console.log(`Sent ${notifications.length} alert notifications for venue ${venueId}`);
  } catch (error) {
    console.error('Send alert notifications error:', error);
  }
}

async function sendAnnouncementNotifications(venueId, announcement) {
  try {
    // Get active subscriptions for the venue
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('device_token, notification_preferences')
      .eq('venue_id', venueId)
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    const notifications = subscriptions.map(subscription => {
      const payload = JSON.stringify({
        title: '📢 Important Announcement',
        body: announcement.transcribed_text.substring(0, 100) + '...',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: {
          announcementId: announcement.id,
          venueId: announcement.venue_id,
          type: 'announcement',
          priority: announcement.priority
        }
      });

      return webpush.sendNotification({
        endpoint: subscription.device_token,
        keys: subscription.notification_preferences?.keys || {}
      }, payload);
    });

    await Promise.allSettled(notifications);
    console.log(`Sent ${notifications.length} announcement notifications for venue ${venueId}`);
  } catch (error) {
    console.error('Send announcement notifications error:', error);
  }
}

// =================== CLEANUP CRON JOB ===================

// Run cleanup every minute to remove expired announcements
cron.schedule('* * * * *', async () => {
  try {
    const { data, error } = await supabase
      .from('temporary_announcements')
      .update({ status: 'expired' })
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'active');

    if (error) throw error;
    if (data && data.length > 0) {
      console.log(`Expired ${data.length} announcements`);
    }
  } catch (error) {
    console.error('Cleanup cron error:', error);
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PublicAlert Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
});

module.exports = app;