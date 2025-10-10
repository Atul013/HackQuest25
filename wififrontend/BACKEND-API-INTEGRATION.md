# Backend API Integration Guide

## 🎯 Overview

The WiFi frontend will send user registration data (including location) to your Google Cloud backend. The backend needs to verify if the user is within any geofenced venue.

---

## 📡 API Endpoint Required

### **POST /api/register**

Your backend should expose this endpoint to receive registration data.

---

## 📨 Request Format

### Headers
```
Content-Type: application/json
```

### Request Body (JSON)
```json
{
  "phone": "+915588936954",
  "countryCode": "+91",
  "phoneNumber": "5588936954",
  "language": "en",
  "locationTracking": true,
  "backgroundAlerts": true,
  "latitude": 9.9312328,
  "longitude": 76.2673041,
  "accuracy": 20,
  "timestamp": "2025-10-11T18:30:45.123Z"
}
```

### Field Descriptions

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `phone` | string | Full phone with country code | "+915588936954" |
| `countryCode` | string | Selected country code | "+91" |
| `phoneNumber` | string | Phone without country code | "5588936954" |
| `language` | string | ISO 639-1 language code | "en", "hi", "ml" |
| `locationTracking` | boolean | User allowed location tracking | true/false |
| `backgroundAlerts` | boolean | User allowed background alerts | true/false |
| `latitude` | number/null | GPS latitude | 9.9312328 |
| `longitude` | number/null | GPS longitude | 76.2673041 |
| `accuracy` | number | Location accuracy in meters | 20 |
| `timestamp` | string | ISO 8601 timestamp | "2025-10-11T..." |

**Note:** `latitude` and `longitude` will be `null` if user denies location permission.

---

## ✅ Expected Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Registration successful",
  "userId": "user_12345",
  "inGeofence": true,
  "venue": {
    "id": "venue_1",
    "name": "Rajagiri School of Engineering & Technology",
    "latitude": 9.9312,
    "longitude": 76.2673,
    "radius": 500
  },
  "subscription": {
    "id": "sub_67890",
    "phone": "+915588936954",
    "venueId": "venue_1",
    "language": "en",
    "createdAt": "2025-10-11T18:30:45.123Z"
  }
}
```

### User Outside Geofence (200 OK)

```json
{
  "success": true,
  "message": "Registration successful. Not in any monitored venue.",
  "userId": "user_12345",
  "inGeofence": false,
  "venue": null,
  "subscription": {
    "id": "sub_67890",
    "phone": "+915588936954",
    "venueId": null,
    "language": "en",
    "createdAt": "2025-10-11T18:30:45.123Z"
  }
}
```

### Error Response (400/500)

```json
{
  "success": false,
  "error": "Invalid phone number format",
  "code": "INVALID_PHONE"
}
```

---

## 🔧 Backend Implementation Logic

### 1. **Receive Registration**
```javascript
// Express.js example
app.post('/api/register', async (req, res) => {
  const { phone, latitude, longitude, language, locationTracking, backgroundAlerts } = req.body;
  
  // Validate input
  if (!phone || phone.length < 10) {
    return res.status(400).json({ success: false, error: 'Invalid phone number' });
  }
  
  // ... continue processing
});
```

### 2. **Check Geofence**
```javascript
// Get all venues from database
const venues = await supabase
  .from('venues')
  .select('*')
  .eq('active', true);

let userVenue = null;
let inGeofence = false;

if (latitude && longitude) {
  // Check each venue
  for (const venue of venues.data) {
    const distance = calculateDistance(
      latitude, longitude,
      venue.latitude, venue.longitude
    );
    
    if (distance <= venue.radius) {
      userVenue = venue;
      inGeofence = true;
      break;
    }
  }
}
```

### 3. **Calculate Distance (Haversine Formula)**
```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}
```

### 4. **Store Subscription**
```javascript
// Insert into subscriptions table
const subscription = await supabase
  .from('subscriptions')
  .insert({
    phone: phone,
    venue_id: userVenue ? userVenue.id : null,
    language: language,
    location_tracking: locationTracking,
    background_alerts: backgroundAlerts,
    last_latitude: latitude,
    last_longitude: longitude,
    last_seen: new Date().toISOString()
  })
  .select()
  .single();
```

### 5. **Return Response**
```javascript
res.json({
  success: true,
  message: inGeofence ? 'Registration successful' : 'Registration successful. Not in any monitored venue.',
  userId: subscription.data.id,
  inGeofence: inGeofence,
  venue: userVenue,
  subscription: subscription.data
});
```

---

## 🗄️ Database Schema

### **subscriptions** table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL UNIQUE,
  venue_id UUID REFERENCES venues(id),
  language VARCHAR(10) DEFAULT 'en',
  location_tracking BOOLEAN DEFAULT false,
  background_alerts BOOLEAN DEFAULT false,
  last_latitude DECIMAL(10, 8),
  last_longitude DECIMAL(11, 8),
  last_seen TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

CREATE INDEX idx_subscriptions_phone ON subscriptions(phone);
CREATE INDEX idx_subscriptions_venue ON subscriptions(venue_id);
```

### **venues** table (should already exist)

```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius INTEGER NOT NULL, -- in meters
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Frontend Configuration

### Update Backend URL

In `login-mypublicwifi.html`, line ~95, update:

```javascript
var BACKEND_URL = 'https://your-backend-url.run.app/api/register';
```

**Replace with your actual Google Cloud Run URL**, for example:
```javascript
var BACKEND_URL = 'https://hackquest-backend-abc123.run.app/api/register';
```

---

## 🧪 Testing

### Test with cURL

```bash
curl -X POST https://your-backend.run.app/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+915588936954",
    "countryCode": "+91",
    "phoneNumber": "5588936954",
    "language": "en",
    "locationTracking": true,
    "backgroundAlerts": true,
    "latitude": 9.9312328,
    "longitude": 76.2673041,
    "accuracy": 20,
    "timestamp": "2025-10-11T18:30:45.123Z"
  }'
```

### Test Location Inside Geofence

**Rajagiri School coordinates:**
- Latitude: 9.9312328
- Longitude: 76.2673041
- Radius: 500m

**Test coordinate (inside):**
```json
{
  "latitude": 9.9315000,
  "longitude": 76.2675000
}
```

**Test coordinate (outside):**
```json
{
  "latitude": 9.9500000,
  "longitude": 76.3000000
}
```

---

## 🔒 Security Considerations

### 1. **Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 registrations per IP
  message: 'Too many registration attempts'
});

app.post('/api/register', registrationLimiter, async (req, res) => {
  // ...
});
```

### 2. **Phone Number Validation**
```javascript
function isValidPhone(phone) {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}
```

### 3. **CORS Configuration**
```javascript
const cors = require('cors');

app.use(cors({
  origin: ['http://192.168.137.1', 'http://localhost:8080'],
  methods: ['POST'],
  credentials: true
}));
```

---

## 📊 Backend Flow Diagram

```
User Submits Form
       ↓
Frontend requests Geolocation
       ↓
[User Allows/Denies]
       ↓
Frontend sends POST to /api/register
       ↓
Backend validates input
       ↓
Backend checks if lat/lng in any geofence
       ↓
Backend stores subscription in Supabase
       ↓
Backend returns response with venue info
       ↓
Frontend shows success page
       ↓
User can browse internet
```

---

## ✅ Checklist

Before going live:

- [ ] Backend endpoint `/api/register` created
- [ ] Geofence checking logic implemented
- [ ] Database tables created (subscriptions)
- [ ] Distance calculation (Haversine) working
- [ ] CORS configured for WiFi portal IP
- [ ] Rate limiting enabled
- [ ] Phone validation implemented
- [ ] Error handling added
- [ ] Frontend URL updated with backend URL
- [ ] Test with real coordinates
- [ ] Test with user inside geofence
- [ ] Test with user outside geofence
- [ ] Test location permission denied

---

## 🎯 Next Steps

1. **Share your Google Cloud backend URL**
2. I'll update the frontend with your actual endpoint
3. Test the full flow on mobile device
4. Verify geofence detection works
5. Deploy to production!

**Ready to integrate! Share your backend URL when it's ready.** 🚀
