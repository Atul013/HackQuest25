# PublicAlert API Testing Guide

Quick testing commands for the PublicAlert backend API during development.

## Quick Start
```bash
# Install dependencies and start server
npm install
npm run dev

# Server runs on http://localhost:3000
```

## Test Commands (using curl)

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Admin Login
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password": "hackathon2025"}'

# Save the token for admin requests
```

### 3. Create Venue (Admin Required)
```bash
curl -X POST http://localhost:3000/api/venues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test Station",
    "type": "railway_station",
    "address": "123 Main St, City",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "radius": 100,
    "capacity": 5000,
    "contactInfo": {"phone": "+1234567890"},
    "emergencyContacts": [{"name": "Security", "phone": "+1987654321"}],
    "facilities": ["wifi", "restrooms", "parking"]
  }'
```

### 4. Get All Venues
```bash
curl http://localhost:3000/api/venues
```

### 5. Subscribe to Venue Notifications
```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "venueId": "VENUE_ID_FROM_STEP_3",
    "deviceToken": "test-device-token-123",
    "notificationPreferences": {
      "alerts": true,
      "announcements": true,
      "emergencies": true
    }
  }'
```

### 6. Create Emergency Alert (Admin Required)
```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "venueId": "VENUE_ID_FROM_STEP_3",
    "alertType": "emergency",
    "severity": "high",
    "title": "Test Emergency Alert",
    "message": "This is a test emergency alert for the venue.",
    "instructions": "Please remain calm and follow staff directions.",
    "affectedAreas": ["Platform 1", "Main Entrance"],
    "estimatedDuration": 30
  }'
```

### 7. Get Venue Alerts
```bash
curl http://localhost:3000/api/venues/VENUE_ID_FROM_STEP_3/alerts
```

### 8. Create Temporary Announcement (Admin Required)
```bash
curl -X POST http://localhost:3000/api/announcements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "venueId": "VENUE_ID_FROM_STEP_3",
    "transcribedText": "Attention passengers, the next train to downtown will arrive in 5 minutes at platform 2.",
    "announcementType": "transport",
    "priority": "medium",
    "durationMinutes": 10
  }'
```

### 9. Get Venue Announcements
```bash
curl http://localhost:3000/api/venues/VENUE_ID_FROM_STEP_3/announcements
```

### 10. Generate QR Code for Venue
```bash
curl http://localhost:3000/api/venues/VENUE_ID_FROM_STEP_3/qr
```

### 11. Get User Subscriptions
```bash
curl http://localhost:3000/api/subscriptions/test-device-token-123
```

### 12. Unsubscribe from Venue
```bash
curl -X DELETE http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "venueId": "VENUE_ID_FROM_STEP_3",
    "deviceToken": "test-device-token-123"
  }'
```

## Testing with Postman

### Import Collection
Create a new Postman collection with these requests, and set environment variables:
- `baseUrl`: `http://localhost:3000`
- `adminToken`: (from login response)
- `venueId`: (from venue creation response)

### Environment Variables
```json
{
  "baseUrl": "http://localhost:3000",
  "adminToken": "",
  "venueId": "",
  "deviceToken": "test-device-token-123"
}
```

## Test Data Examples

### Sample Venue Types
- `railway_station`
- `airport`
- `shopping_mall`
- `concert_venue`
- `sports_stadium`
- `hospital`
- `university`
- `office_building`

### Sample Alert Types
- `emergency` (fire, evacuation)
- `security` (suspicious activity)
- `weather` (severe weather)
- `transport` (delays, disruptions)
- `maintenance` (planned work)
- `medical` (medical emergency)

### Sample Severities
- `critical` (immediate action required)
- `high` (urgent attention needed)
- `medium` (important information)
- `low` (general notice)

## Auto-Cleanup Testing

The system automatically expires announcements after their set duration. To test:

1. Create an announcement with `durationMinutes: 1`
2. Wait 1-2 minutes
3. Check the announcements endpoint - it should be gone
4. Check server logs for cleanup activity

## Push Notification Testing

To test push notifications:
1. Set up proper VAPID keys in .env
2. Create a venue and subscribe with valid push subscription data
3. Create an alert - notifications should be sent automatically
4. Check browser dev tools for notification delivery

## Common Issues

### CORS Errors
- Ensure frontend origin is added to CORS configuration
- Check that requests include proper headers

### Authentication Errors
- Verify JWT token is included in Authorization header
- Check token hasn't expired (24-hour limit)

### Database Errors
- Ensure Supabase credentials are correct in .env
- Verify database schema has been applied
- Check RLS policies are configured

### Push Notification Issues
- Verify VAPID keys are properly configured
- Ensure subscription data includes valid endpoint and keys
- Check browser notification permissions

---

**Testing Checklist for Demo:**
- [ ] Health check responds
- [ ] Admin login works
- [ ] Venue creation and retrieval
- [ ] Subscription management
- [ ] Alert creation and broadcasting
- [ ] Temporary announcements
- [ ] QR code generation
- [ ] Auto-cleanup verification