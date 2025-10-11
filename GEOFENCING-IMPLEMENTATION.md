# 🎯 Complete Geofencing Implementation Guide

## Overview

This system ensures that users registered via the WiFi portal at `https://hackquest25.el.r.appspot.com/` receive emergency announcements **ONLY when they are inside a geofenced area**.

---

## 📋 How It Works

### 1. User Registration (Initial)
- User connects to WiFi
- Opens portal: `https://hackquest25.el.r.appspot.com/`
- Enters phone number and enables "Location Tracking"
- System captures initial GPS coordinates
- Checks if user is inside any of the 4 venues

### 2. Continuous Monitoring (Every 2 Minutes)
- Location Monitor Service runs in background
- Checks user's current GPS location
- Compares against all 4 venue geofences
- Updates database with current status

### 3. Geofence Status
- **INSIDE**: User receives announcements for that venue
- **OUTSIDE**: User does NOT receive announcements
- **MOVED TO DIFFERENT VENUE**: Automatically switches venue association

---

## 🗺️ The 4 Geofenced Venues

### 1. **Ernakulam Junction Railway Station**
- **Location**: 9.9816°N, 76.2999°E
- **Geofence**: 300m circular + rectangular polygon
- **Type**: Major transportation hub
- **Coverage**: All platforms, waiting areas, ticket counters

### 2. **Cochin International Airport**
- **Location**: 10.1520°N, 76.3919°E
- **Geofence**: 800m circular + large rectangular polygon
- **Type**: International airport
- **Coverage**: Terminals 1, 2, 3, runways, parking

### 3. **Lulu Mall Kochi**
- **Location**: 10.0272°N, 76.3126°E
- **Geofence**: 400m circular + precise rectangular polygon
- **Type**: Shopping mall (India's largest)
- **Coverage**: 4 floors, 215+ stores, parking

### 4. **Rajagiri School of Engineering & Technology**
- **Location**: 9.9935°N, 76.3580°E
- **Geofence**: 500m circular + campus polygon
- **Type**: Educational institution
- **Coverage**: Engineering departments, hostels, sports facilities

---

## ⚙️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  USER DEVICE (Mobile/Laptop)                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────┐            │
│  │  WiFi Portal (hackquest25.el.r.appspot.com)│           │
│  │  - Registration form                        │           │
│  │  - Location permission request              │           │
│  │  - Initial geofence check                   │           │
│  └────────────────────────────────────────────┘            │
│                    ↓                                        │
│  ┌────────────────────────────────────────────┐            │
│  │  Location Monitor Service (location-monitor.js)│        │
│  │  - Runs every 2 minutes                     │           │
│  │  - Gets current GPS coordinates             │           │
│  │  - Checks against 4 venues                  │           │
│  │  - Updates Supabase database                │           │
│  └────────────────────────────────────────────┘            │
│                    ↓                                        │
└─────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  SUPABASE DATABASE (Cloud)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Table: wifi_subscriptions                                 │
│  ┌───────────────────────────────────────────────┐         │
│  │ phone              | +919876543210             │         │
│  │ last_latitude      | 9.9816                    │         │
│  │ last_longitude     | 76.2999                   │         │
│  │ venue_id           | uuid-of-ernakulam-station │ ◄──┐   │
│  │ active             | true/false                │    │   │
│  │ last_seen          | 2025-10-11T05:45:00Z      │    │   │
│  └───────────────────────────────────────────────┘    │   │
│                                                         │   │
│  Table: venues                                          │   │
│  ┌───────────────────────────────────────────────┐     │   │
│  │ id (venue_id)     | uuid-of-ernakulam-station │ ────┘   │
│  │ name              | Ernakulam Junction...     │         │
│  │ latitude          | 9.9816                    │         │
│  │ longitude         | 76.2999                   │         │
│  │ radius            | 300                       │         │
│  │ polygon_coordinates| [[9.983,76.2985],...]   │         │
│  │ active            | true                      │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  ANNOUNCEMENT SYSTEM                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Query: Get all active users in venue X                    │
│  ┌────────────────────────────────────────────┐            │
│  │ SELECT phone FROM wifi_subscriptions       │            │
│  │ WHERE venue_id = 'venue-X-uuid'            │            │
│  │   AND active = true                        │            │
│  │   AND last_seen > NOW() - INTERVAL '5 min' │            │
│  └────────────────────────────────────────────┘            │
│                    ↓                                        │
│  Send announcements ONLY to these users                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Steps

### Step 1: Deploy Updated Frontend

```powershell
cd E:\Projects\HackQuest25\wififrontend
gcloud app deploy --quiet
```

**Files deployed:**
- ✅ `login-mypublicwifi.html` (with location monitor integration)
- ✅ `location-monitor.js` (new monitoring service)
- ✅ `success.html`
- ✅ `style.css`

### Step 2: Set Up Supabase Venues

1. Go to: https://app.supabase.com/project/akblmbpxxotmebzghczj/editor
2. Open SQL Editor
3. Paste contents of `kochi-venues-setup.sql`
4. Click "Run"

This will:
- ✅ Create/update 4 venues
- ✅ Set up polygon geofences
- ✅ Create spatial indexes
- ✅ Configure emergency contacts

### Step 3: Verify Database Structure

Make sure these tables exist in Supabase:

**Table: `venues`**
```sql
- id (uuid, primary key)
- name (text)
- type (text)
- address (text)
- latitude (decimal)
- longitude (decimal)
- radius (integer) -- meters
- polygon_coordinates (array) -- [[lat,lon],...]
- active (boolean)
- contact_info (jsonb)
- emergency_contacts (jsonb)
- facilities (text[])
- created_at (timestamp)
- updated_at (timestamp)
```

**Table: `wifi_subscriptions`**
```sql
- id (uuid, primary key)
- phone (text, unique)
- country_code (text)
- phone_number (text)
- language (text)
- location_tracking (boolean)
- background_alerts (boolean)
- last_latitude (decimal)
- last_longitude (decimal)
- location_accuracy (decimal)
- venue_id (uuid, foreign key → venues.id)
- active (boolean) -- TRUE = receives announcements
- registered_at (timestamp)
- last_seen (timestamp)
```

---

## 🧪 Testing the Complete Flow

### Test 1: Register Inside Geofence

1. Open: https://hackquest25.el.r.appspot.com/
2. Enter test coordinates (use Chrome DevTools):
   ```javascript
   // Override geolocation to Ernakulam Junction
   navigator.geolocation.getCurrentPosition = function(success) {
       success({
           coords: {
               latitude: 9.9816,
               longitude: 76.2999,
               accuracy: 10
           }
       });
   };
   ```
3. Enter phone: `+91 9876543210`
4. Check "Location Tracking"
5. Submit
6. **Expected**:
   - ✅ User registered
   - ✅ `venue_id` = Ernakulam Junction UUID
   - ✅ `active` = true
   - ✅ Location monitoring starts

### Test 2: Verify Continuous Monitoring

After registration:
1. Open browser console (F12)
2. Every 2 minutes, you should see:
   ```
   🔄 Updating location...
   📍 New location: 9.9816, 76.2999 (±10m)
   🔍 Checking geofence status...
      Checking against 4 venues...
   ✅ INSIDE: Ernakulam Junction Railway Station
   ✅ Database location updated
   ```

### Test 3: User Exits Geofence

1. Simulate movement outside (in console):
   ```javascript
   // Move to coordinates outside all venues
   window.locationMonitor.updateLocation();
   ```
2. **Expected logs**:
   ```
   ❌ OUTSIDE all geofences
   🚪 User has LEFT the geofenced area!
   ========================================
   🚪 USER EXITED GEOFENCE
   ========================================
   Actions:
     1. Clearing venue association
     2. User will NO LONGER receive announcements
     3. Monitoring continues (in case user returns)
   ========================================
   ```
3. **Database changes**:
   - ✅ `venue_id` = NULL
   - ✅ `active` = false
   - ✅ User NO LONGER receives announcements

### Test 4: User Re-enters Geofence

1. Simulate movement back inside
2. **Expected**:
   - ✅ `venue_id` = Ernakulam Junction UUID
   - ✅ `active` = true
   - ✅ User receives announcements again

---

## 📊 Database Queries for Announcements

### Get All Active Users in a Venue

```sql
-- Get users to send announcement to
SELECT 
    phone,
    language,
    last_latitude,
    last_longitude,
    last_seen
FROM wifi_subscriptions
WHERE venue_id = 'YOUR-VENUE-UUID'
  AND active = true
  AND last_seen > NOW() - INTERVAL '5 minutes'
ORDER BY last_seen DESC;
```

### Check User's Current Status

```sql
-- Check if specific user should receive announcements
SELECT 
    w.phone,
    w.active,
    w.venue_id,
    v.name as venue_name,
    w.last_seen,
    EXTRACT(EPOCH FROM (NOW() - w.last_seen)) as seconds_since_last_seen
FROM wifi_subscriptions w
LEFT JOIN venues v ON w.venue_id = v.id
WHERE w.phone = '+919876543210';
```

### Get Venue Statistics

```sql
-- Count users in each venue
SELECT 
    v.name,
    v.type,
    COUNT(w.id) as active_users,
    MAX(w.last_seen) as most_recent_activity
FROM venues v
LEFT JOIN wifi_subscriptions w ON v.id = w.venue_id AND w.active = true
WHERE v.active = true
GROUP BY v.id, v.name, v.type
ORDER BY active_users DESC;
```

---

## 🔧 Troubleshooting

### Issue: Location monitoring not starting

**Check:**
1. Open browser console
2. Look for: `✅ Location Monitoring Service loaded`
3. Check: `window.locationMonitor.getStatus()`

**Fix:**
```javascript
// Manually start monitoring
window.locationMonitor.startMonitoring(
    '+919876543210',  // phone
    9.9816,           // lat
    76.2999           // lon
);
```

### Issue: User stays active after leaving geofence

**Check database:**
```sql
SELECT active, venue_id, last_seen 
FROM wifi_subscriptions 
WHERE phone = '+919876543210';
```

**Manual fix:**
```sql
UPDATE wifi_subscriptions 
SET active = false, venue_id = NULL 
WHERE phone = '+919876543210';
```

### Issue: Geofence check not working

**Test geofence logic:**
```javascript
// In browser console
const monitor = window.locationMonitor;

// Test if point is inside venue
const testLat = 9.9816;  // Ernakulam Junction
const testLon = 76.2999;

console.log('Testing geofence...');
// Load venues and test
```

---

## 📝 Files Created/Modified

### New Files
1. ✅ `wififrontend/location-monitor.js` - Location monitoring service
2. ✅ `kochi-venues-setup.sql` - Venue configuration SQL

### Modified Files
1. ✅ `wififrontend/login-mypublicwifi.html` - Added location monitor integration
2. ✅ `wififrontend/app.yaml` - Updated to serve new JS file

---

## ✅ Success Criteria

Your system is working correctly if:

1. ✅ User registration captures location
2. ✅ Initial geofence check assigns venue
3. ✅ Location updates every 2 minutes
4. ✅ `active` = true when INSIDE geofence
5. ✅ `active` = false when OUTSIDE geofence
6. ✅ Announcements only sent to active users
7. ✅ Users can move between venues seamlessly

---

## 🎯 Next Steps

1. **Deploy updated frontend**
   ```powershell
   cd wififrontend
   gcloud app deploy --quiet
   ```

2. **Set up venues in Supabase**
   - Run `kochi-venues-setup.sql`

3. **Test with real device**
   - Register at one of the 4 venues
   - Walk around to test geofence boundaries

4. **Integrate with announcement system**
   - Use the SQL queries above
   - Send announcements only to active users

---

## 📞 Support

- **Supabase Dashboard**: https://app.supabase.com/project/akblmbpxxotmebzghczj
- **WiFi Portal**: https://hackquest25.el.r.appspot.com/
- **Documentation**: This file + `DEPLOYMENT-SUCCESS.md`

**Your geofencing system is ready! 🚀**
