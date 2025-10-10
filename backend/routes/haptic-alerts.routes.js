/**
 * Haptic Alerts Routes
 * API endpoints for triggering haptic/visual alerts on user devices
 */

const express = require('express');
const router = express.Router();

/**
 * POST /api/haptic-alerts/trigger
 * Trigger haptic alert for subscribed users in a venue
 * 
 * Body:
 * {
 *   "venueId": "venue-uuid",
 *   "severity": "critical|high|medium",
 *   "message": "Emergency message",
 *   "morseCode": "SOS|FIRE|HELP|etc"
 * }
 */
router.post('/trigger', async (req, res) => {
  try {
    const { venueId, severity, message, morseCode } = req.body;

    // Validation
    if (!venueId || !severity) {
      return res.status(400).json({
        error: 'Missing required fields: venueId, severity'
      });
    }

    // Get all subscribed users for this venue
    const subscribers = await getVenueSubscribers(venueId);

    if (subscribers.length === 0) {
      return res.status(200).json({
        message: 'No subscribers found for this venue',
        triggered: 0
      });
    }

    // Prepare alert payload
    const alertPayload = {
      type: 'haptic_alert',
      severity: severity,
      message: message || 'Emergency Alert',
      morseCode: morseCode || 'SOS',
      timestamp: new Date().toISOString(),
      venueId: venueId
    };

    // Send push notifications with haptic alert instructions
    const notifications = subscribers.map(subscriber => ({
      subscription: subscriber.push_subscription,
      payload: JSON.stringify(alertPayload)
    }));

    // Trigger web push notifications
    // These will be received by the service worker and trigger haptic alerts
    let successCount = 0;
    for (const notification of notifications) {
      try {
        await sendPushNotification(notification);
        successCount++;
      } catch (error) {
        console.error('Failed to send push notification:', error);
      }
    }

    res.json({
      message: 'Haptic alerts triggered',
      triggered: successCount,
      total: subscribers.length,
      severity: severity,
      morseCode: morseCode || 'SOS'
    });

  } catch (error) {
    console.error('Error triggering haptic alerts:', error);
    res.status(500).json({
      error: 'Failed to trigger haptic alerts',
      details: error.message
    });
  }
});

/**
 * POST /api/haptic-alerts/test
 * Test haptic alert for a single device
 */
router.post('/test', async (req, res) => {
  try {
    const { deviceToken, severity, morseCode } = req.body;

    if (!deviceToken) {
      return res.status(400).json({
        error: 'Missing deviceToken'
      });
    }

    const alertPayload = {
      type: 'haptic_alert_test',
      severity: severity || 'critical',
      message: 'TEST: Haptic Alert System',
      morseCode: morseCode || 'SOS',
      timestamp: new Date().toISOString()
    };

    // Send test notification
    await sendTestNotification(deviceToken, alertPayload);

    res.json({
      message: 'Test haptic alert sent',
      payload: alertPayload
    });

  } catch (error) {
    console.error('Error sending test alert:', error);
    res.status(500).json({
      error: 'Failed to send test alert',
      details: error.message
    });
  }
});

/**
 * Helper: Get venue subscribers from database
 */
async function getVenueSubscribers(venueId) {
  // TODO: Integrate with your Supabase database
  // This should query the subscriptions table
  
  // Example Supabase query:
  /*
  const { data, error } = await supabase
    .from('subscriptions')
    .select('device_token, push_subscription')
    .eq('venue_id', venueId)
    .eq('active', true);
  
  return data || [];
  */
  
  // Placeholder return
  return [];
}

/**
 * Helper: Send push notification
 */
async function sendPushNotification(notification) {
  // TODO: Integrate with web-push library
  // This should use your VAPID keys to send push notifications
  
  // Example implementation:
  /*
  const webpush = require('web-push');
  
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  
  await webpush.sendNotification(
    notification.subscription,
    notification.payload
  );
  */
  
  console.log('Sending push notification:', notification);
}

/**
 * Helper: Send test notification
 */
async function sendTestNotification(deviceToken, payload) {
  // TODO: Implement test notification
  console.log('Sending test notification to:', deviceToken, payload);
}

module.exports = router;
