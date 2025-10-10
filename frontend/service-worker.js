/**
 * Service Worker for Haptic Alerts
 * Receives push notifications and triggers haptic/visual alerts
 */

// Listen for push notifications
self.addEventListener('push', async (event) => {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  const data = event.data.json();
  console.log('Push notification received:', data);

  // Handle haptic alert
  if (data.type === 'haptic_alert' || data.type === 'haptic_alert_test') {
    event.waitUntil(handleHapticAlert(data));
  } else {
    // Regular notification
    event.waitUntil(showNotification(data));
  }
});

/**
 * Handle haptic alert with vibration and flash
 */
async function handleHapticAlert(data) {
  const { severity, message, morseCode, timestamp } = data;

  // Show notification first
  await self.registration.showNotification('🚨 Emergency Alert', {
    body: message,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: getVibrationPattern(severity, morseCode),
    tag: 'emergency-alert',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Alert'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    data: {
      type: 'haptic_alert',
      severity: severity,
      morseCode: morseCode,
      timestamp: timestamp
    }
  });

  // Send message to all clients to trigger flash
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => {
    client.postMessage({
      type: 'TRIGGER_HAPTIC_ALERT',
      severity: severity,
      morseCode: morseCode,
      message: message
    });
  });
}

/**
 * Get vibration pattern based on severity and morse code
 */
function getVibrationPattern(severity, morseCode) {
  // Morse code timings
  const DOT = 200;
  const DASH = 600;
  const GAP_SYMBOL = 200;
  const GAP_LETTER = 600;

  // Default SOS pattern: ... --- ...
  let pattern = [
    DOT, GAP_SYMBOL, DOT, GAP_SYMBOL, DOT, GAP_LETTER,  // ...
    DASH, GAP_SYMBOL, DASH, GAP_SYMBOL, DASH, GAP_LETTER,  // ---
    DOT, GAP_SYMBOL, DOT, GAP_SYMBOL, DOT  // ...
  ];

  // Custom patterns for different morse codes
  const morsePatterns = {
    'SOS': pattern,  // ... --- ...
    'HELP': [DOT,GAP_SYMBOL,DOT,GAP_SYMBOL,DOT,GAP_SYMBOL,DOT,GAP_LETTER,  // ....
             DOT,GAP_LETTER,  // .
             DOT,GAP_SYMBOL,DASH,GAP_SYMBOL,DOT,GAP_SYMBOL,DOT,GAP_LETTER,  // .-..
             DOT,GAP_SYMBOL,DASH,GAP_SYMBOL,DASH,GAP_SYMBOL,DOT],  // .--.
    'FIRE': [DOT,GAP_SYMBOL,DOT,GAP_SYMBOL,DASH,GAP_SYMBOL,DOT,GAP_LETTER,  // ..-.
             DOT,GAP_SYMBOL,DOT,GAP_LETTER,  // ..
             DOT,GAP_SYMBOL,DASH,GAP_SYMBOL,DOT,GAP_LETTER,  // .-.
             DOT],  // .
    'DANGER': [DASH,GAP_SYMBOL,DOT,GAP_SYMBOL,DOT,GAP_LETTER]  // -.. (simplified)
  };

  pattern = morsePatterns[morseCode] || morsePatterns['SOS'];

  // Repeat based on severity
  if (severity === 'critical') {
    // Repeat pattern 3 times for critical
    return [...pattern, 1000, ...pattern, 1000, ...pattern];
  } else if (severity === 'high') {
    // Repeat pattern 2 times
    return [...pattern, 1000, ...pattern];
  }

  return pattern;
}

/**
 * Show regular notification
 */
async function showNotification(data) {
  await self.registration.showNotification(data.title || 'Public Alert', {
    body: data.body || data.message,
    icon: data.icon || '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.tag || 'alert',
    data: data
  });
}

/**
 * Handle notification click
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;

  if (event.action === 'view' || !event.action) {
    // Open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // If app is already open, focus it
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }
          // Otherwise open new window
          if (clients.openWindow) {
            return clients.openWindow('/alerts');
          }
        })
    );
  }
});

/**
 * Handle background sync (optional - for offline resilience)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-alerts') {
    event.waitUntil(syncAlerts());
  }
});

async function syncAlerts() {
  // Sync pending alerts when connection is restored
  console.log('Syncing alerts...');
}

/**
 * Cache strategy for offline support
 */
self.addEventListener('fetch', (event) => {
  // Add caching strategy if needed
});

console.log('Service Worker loaded: Haptic alerts ready');
