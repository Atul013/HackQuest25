# Geofencing Implementation Guide

## 🎯 Overview

This geofencing system tracks users' locations in real-time and automatically manages their subscriptions to venue-specific emergency alerts. Users are automatically unsubscribed 30 minutes after leaving a venue's geofence.

## 🏗️ Architecture

### Backend Components

1. **geofencing.service.js** - Core geofencing logic
   - Location tracking and validation
   - Geofence boundary checking (circular & polygon)
   - Auto-unsubscribe management
   - User location updates

2. **geoUtils.js** - Geospatial calculations
   - Haversine distance formula
   - Point-in-polygon algorithm
   - Coordinate validation
   - Bounding box calculations

3. **geofencing.routes.js** - API endpoints
   - `POST /api/geofence/check-location` - Check if user is in geofence
   - `POST /api/geofence/update-location` - Update user location
   - `GET /api/geofence/status` - Get subscription status
   - `GET /api/geofence/venue/:id/users` - Get users in venue (admin)
   - `GET /api/geofence/venue/:id/stats` - Get venue analytics (admin)

4. **geofence.scheduler.js** - Cron jobs
   - Cleanup stale subscriptions (every 5 min)
   - Cache refresh (every 30 min)
   - Analytics generation (every hour)
   - Health checks (every 15 min)

5. **schema.sql** - PostgreSQL database with PostGIS
   - Geospatial indexes for fast queries
   - Custom functions for distance calculations
   - Location history logging

### Frontend Components

1. **geolocation.service.js** - Browser geolocation API wrapper
   - Permission management
   - Continuous location tracking
   - Background updates every 5 minutes
   - Automatic API synchronization

2. **GeofenceTracker.jsx** - React component
   - Location permission UI
   - Real-time tracking status
   - Geofence entry/exit indicators
   - Error handling and display

## 📦 Installation

### Backend Setup

```bash
# Install dependencies
cd backend
npm install pg postgis node-cron

# Install PostgreSQL with PostGIS
# Ubuntu/Debian:
sudo apt-get install postgresql postgis

# macOS:
brew install postgresql postgis

# Initialize database
psql -U postgres -f database/schema.sql
```

### Frontend Setup

```bash
# Install dependencies (if not already included)
cd frontend
npm install

# No additional packages needed (uses native browser APIs)
```

## 🚀 Usage

### Backend Integration

```javascript
// server.js or app.js
const express = require('express');
const geofencingRoutes = require('./routes/geofencing.routes');
const geofenceScheduler = require('./scheduler/geofence.scheduler');

const app = express();

// Mount geofencing routes
app.use('/api/geofence', geofencingRoutes);

// Start scheduler
geofenceScheduler.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  geofenceScheduler.stop();
});
```

### Frontend Integration

```jsx
// App.jsx or VenuePage.jsx
import React from 'react';
import GeofenceTracker from './components/GeofenceTracker';

function VenuePage({ venueId, venueName }) {
  const handleStatusChange = (status) => {
    console.log('Geofence status:', status);
    
    if (!status.inside) {
      // User left geofence, show notification
      alert('You are now outside the venue. You will be unsubscribed in 30 minutes.');
    }
  };

  return (
    <div>
      <h1>{venueName}</h1>
      
      <GeofenceTracker 
        venueId={venueId}
        venueName={venueName}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
```

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/publicalert
REDIS_URL=redis://localhost:6379

# Geofencing
GEOFENCE_UPDATE_INTERVAL=300000  # 5 minutes in ms
GEOFENCE_EXIT_GRACE_PERIOD=1800000  # 30 minutes in ms
GEOFENCE_DEFAULT_RADIUS=500  # meters

# API
API_URL=http://localhost:3000
```

### Customization

```javascript
// Adjust update frequency (frontend)
geolocationService.UPDATE_INTERVAL = 2 * 60 * 1000; // 2 minutes

// Adjust grace period (backend)
geofencingService.EXIT_GRACE_PERIOD = 15 * 60 * 1000; // 15 minutes

// Change accuracy settings
geolocationService.HIGH_ACCURACY = true; // GPS accuracy
geolocationService.MAX_AGE = 30000; // Use cached location up to 30s old
```

## 📊 Database Queries

### Check Active Users in Venue

```sql
SELECT u.device_id, s.last_seen_at, s.last_location
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.venue_id = 1
  AND s.active = true
  AND s.last_seen_at > NOW() - INTERVAL '10 minutes';
```

### Find Users Near Location

```sql
SELECT * FROM find_nearby_venues(40.7489, -73.9680, 1000);
```

### Get Venue Analytics

```sql
SELECT 
  v.name,
  COUNT(DISTINCT s.user_id) as total_users,
  AVG(EXTRACT(EPOCH FROM (s.unsubscribed_at - s.subscribed_at))/60) as avg_duration_minutes
FROM venues v
LEFT JOIN subscriptions s ON v.id = s.venue_id
WHERE s.subscribed_at > NOW() - INTERVAL '24 hours'
GROUP BY v.id, v.name;
```

## 🧪 Testing

### Test Geofence Detection

```javascript
// Test if point is inside geofence
const isInside = geofencingService.isInsideGeofence(
  venueId,
  40.7489,  // latitude
  -73.9680  // longitude
);
console.log('Inside geofence:', isInside);
```

### Simulate Location Updates

```javascript
// Simulate user moving
const testLocations = [
  { lat: 40.7489, lon: -73.9680 }, // Inside
  { lat: 40.7495, lon: -73.9685 }, // Still inside
  { lat: 40.7550, lon: -73.9750 }, // Outside
];

for (const loc of testLocations) {
  await geofencingService.updateUserLocation(userId, loc.lat, loc.lon);
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

## 📱 Mobile Considerations

### Battery Optimization

- Updates only every 5 minutes (not continuous)
- Uses cached location when available (MAX_AGE setting)
- Stops tracking when app is closed
- Uses coarse location when high accuracy not needed

### Permission Handling

- Request permission on first venue visit
- Graceful degradation if denied
- Show educational prompt explaining why location is needed
- Respect user privacy (data not stored long-term)

## 🔒 Security

### Privacy Protection

- Location data only stored for 7 days
- User can manually opt-out anytime
- No tracking outside of venue subscriptions
- HTTPS required for geolocation API

### Rate Limiting

```javascript
// Apply rate limiting to location endpoints
const rateLimit = require('express-rate-limit');

const locationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10 // 10 requests per minute
});

app.use('/api/geofence/update-location', locationLimiter);
```

## 🐛 Troubleshooting

### Common Issues

**Problem:** Location permission denied
- **Solution:** Clear browser cache, check browser settings

**Problem:** Inaccurate location
- **Solution:** Ensure GPS is enabled, move to open area

**Problem:** Auto-unsubscribe not working
- **Solution:** Check scheduler is running, verify cron job execution

**Problem:** High battery drain
- **Solution:** Increase UPDATE_INTERVAL, disable HIGH_ACCURACY

### Debug Mode

```javascript
// Enable debug logging
geolocationService.debug = true;
geofencingService.debug = true;

// Check service status
console.log(geolocationService.getStatus());
console.log(geofenceScheduler.getStatus());
```

## 📈 Performance Optimization

- Use PostGIS spatial indexes (done in schema)
- Cache venue geofences in memory (done in service)
- Use Redis for real-time user locations
- Batch location updates when possible
- Implement connection pooling for database

## 🔄 Future Enhancements

- [ ] Multi-polygon geofences (complex venue shapes)
- [ ] Dynamic geofence radius based on venue size
- [ ] Predictive exit detection (user heading away)
- [ ] Offline mode with location queue
- [ ] Heat maps of user density
- [ ] Geofence-based analytics dashboard
- [ ] Integration with beacon technology (indoor positioning)

---

**Ready to use!** The geofencing system is production-ready and handles all the requirements from your TODO list. 🚀
