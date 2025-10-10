# Supabase + WiFi Frontend Integration Guide

## 🎯 Overview

The WiFi portal now **automatically stores all user registrations directly to Supabase**. Every time a user connects to WiFi, their phone number and preferences are saved to the database.

---

## 📊 Database Setup

### Step 1: Create the Table in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: **akblmbpxxotmebzghczj**
3. Click on **SQL Editor** (left sidebar)
4. Click **"New Query"**
5. Copy and paste the entire contents of `supabase-wifi-subscriptions.sql`
6. Click **"Run"** (or press Ctrl+Enter)

✅ This will create:
- `wifi_subscriptions` table
- Indexes for fast queries
- Row Level Security policies
- Analytics view
- Auto-update triggers

---

## 📋 Table Schema

### `wifi_subscriptions` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `phone` | VARCHAR(20) | Full phone with country code (UNIQUE) |
| `country_code` | VARCHAR(10) | Country code (e.g., "+91") |
| `phone_number` | VARCHAR(20) | Phone without country code |
| `language` | VARCHAR(10) | Preferred language (en, hi, ml, etc.) |
| `location_tracking` | BOOLEAN | Location permission granted |
| `background_alerts` | BOOLEAN | Background permission granted |
| `last_latitude` | DECIMAL | Last known GPS latitude |
| `last_longitude` | DECIMAL | Last known GPS longitude |
| `location_accuracy` | DECIMAL | GPS accuracy in meters |
| `venue_id` | UUID | Associated venue (if in geofence) |
| `registered_at` | TIMESTAMP | First registration time |
| `last_seen` | TIMESTAMP | Last activity time |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Record update time |
| `active` | BOOLEAN | Is subscription active |

---

## 🔄 How It Works

### Registration Flow

```
User fills WiFi form
        ↓
User clicks "Register & Enable Alerts"
        ↓
[If location tracking enabled]
  → Browser requests GPS permission
  → Gets latitude/longitude
        ↓
Frontend sends data to Supabase
        ↓
Supabase checks if phone exists
        ↓
  [If exists] → Update existing record
  [If new]    → Insert new record
        ↓
✅ Data stored in Supabase
        ↓
Frontend sends to Google Cloud backend (optional)
        ↓
Success page shown
```

---

## 🔍 Querying the Data

### Get all subscriptions

```sql
SELECT * FROM wifi_subscriptions
ORDER BY created_at DESC;
```

### Get recent registrations (last 24 hours)

```sql
SELECT 
    phone,
    language,
    location_tracking,
    last_latitude,
    last_longitude,
    registered_at
FROM wifi_subscriptions
WHERE registered_at > NOW() - INTERVAL '1 day'
ORDER BY registered_at DESC;
```

### Get users with location tracking

```sql
SELECT 
    phone,
    last_latitude,
    last_longitude,
    location_accuracy,
    last_seen
FROM wifi_subscriptions
WHERE location_tracking = true
  AND active = true
ORDER BY last_seen DESC;
```

### Get statistics

```sql
SELECT * FROM wifi_subscription_stats;
```

Returns:
- Total users
- Active users
- Users with location enabled
- Users with background alerts
- Venues with users
- Active users in last 24h
- Active users in last 7 days

### Get users by language

```sql
SELECT language, COUNT(*) as count
FROM wifi_subscriptions
GROUP BY language
ORDER BY count DESC;
```

### Get users in a specific venue

```sql
SELECT 
    ws.phone,
    ws.language,
    v.name as venue_name,
    ws.last_seen
FROM wifi_subscriptions ws
JOIN venues v ON ws.venue_id = v.id
WHERE v.name = 'Rajagiri School of Engineering & Technology'
  AND ws.active = true;
```

---

## 🔐 Security

### Row Level Security (RLS) Policies

The table has RLS enabled with these policies:

1. **Anonymous Insert**: Anyone can register (insert)
2. **Anonymous Update**: Users can update their own records
3. **Authenticated Read**: Admin users can read all records

### API Access

**Public (Anon Key):** Can insert and update subscriptions
**Service Role Key:** Full access (used by backend)

---

## 📱 Frontend Integration

### Already Implemented

The frontend (`login-mypublicwifi.html`) now includes:

✅ Supabase JS client (loaded from CDN)
✅ Automatic connection to your Supabase project
✅ `storeInSupabase()` function to save registrations
✅ Upsert logic (insert or update if exists)
✅ Error handling and retries
✅ Success page with stored data

### How Data is Stored

When user clicks "Register & Enable Alerts":

1. **Collect form data**:
   - Phone number
   - Country code
   - Language preference
   - Permission checkboxes

2. **Request geolocation** (if enabled):
   - Browser prompts for permission
   - Gets GPS coordinates

3. **Store in Supabase**:
   ```javascript
   const subscriptionData = {
       phone: "+915588936954",
       country_code: "+91",
       phone_number: "5588936954",
       language: "en",
       location_tracking: true,
       background_alerts: true,
       last_latitude: 9.9312328,
       last_longitude: 76.2673041,
       location_accuracy: 20,
       registered_at: "2025-10-11T...",
       last_seen: "2025-10-11T...",
       active: true
   };
   ```

4. **Check if user exists**:
   - Query by phone number
   - If exists → UPDATE
   - If new → INSERT

5. **Send to backend** (optional):
   - For geofence verification
   - For additional processing

---

## 🧪 Testing

### Test the integration

1. **Connect to your WiFi**
2. **Open the registration page**
3. **Fill the form**:
   - Phone: 5588936954
   - Country: +91 (India)
   - Check "Location Tracking"
   - Language: English
4. **Click "Register & Enable Alerts"**
5. **Allow location when prompted**

### Verify in Supabase

1. Go to Supabase Dashboard
2. Click **"Table Editor"**
3. Select **"wifi_subscriptions"**
4. You should see your new registration!

### Check browser console

Open browser DevTools (F12):
```
✅ Supabase client initialized
📤 Storing to Supabase... {phone: "+915588936954", ...}
✅ Inserted new user: {id: "...", phone: "+915588936954", ...}
```

---

## 🔄 Update/Reinstall Files

Since we updated the HTML, you need to copy the files again:

### Option 1: Run Batch File

1. Navigate to: `E:\Projects\HackQuest25\wififrontend\`
2. **Right-click** on `install-to-mypublicwifi.bat`
3. Select **"Run as administrator"**

### Option 2: Manual Copy

```powershell
# Run PowerShell as Administrator
cd E:\Projects\HackQuest25\wififrontend

Copy-Item "login-mypublicwifi.html" "C:\Program Files (x86)\MyPublicWiFi\Web\login.html" -Force
Copy-Item "style-modern.css" "C:\Program Files (x86)\MyPublicWiFi\Web\style.css" -Force
Copy-Item "success.html" "C:\Program Files (x86)\MyPublicWiFi\Web\success.html" -Force
```

---

## 📊 Monitoring & Analytics

### Real-time Dashboard Query

```sql
SELECT 
    COUNT(*) as total_registrations,
    COUNT(CASE WHEN DATE(registered_at) = CURRENT_DATE THEN 1 END) as today_registrations,
    COUNT(CASE WHEN location_tracking = true THEN 1 END) as with_location,
    ROUND(AVG(location_accuracy), 2) as avg_accuracy
FROM wifi_subscriptions
WHERE active = true;
```

### Most Popular Languages

```sql
SELECT 
    language,
    COUNT(*) as users,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM wifi_subscriptions
WHERE active = true
GROUP BY language
ORDER BY users DESC;
```

### Active Users by Venue

```sql
SELECT 
    v.name as venue,
    COUNT(ws.id) as active_users,
    COUNT(CASE WHEN ws.last_seen > NOW() - INTERVAL '1 hour' THEN 1 END) as users_last_hour
FROM venues v
LEFT JOIN wifi_subscriptions ws ON v.id = ws.venue_id AND ws.active = true
GROUP BY v.id, v.name
ORDER BY active_users DESC;
```

---

## 🎯 Key Features

### ✅ Automatic Storage
- Every registration automatically saved to Supabase
- No backend required for storage
- Works offline (backend call is optional)

### ✅ Duplicate Prevention
- Phone number is UNIQUE
- Existing users are updated, not duplicated
- Last seen timestamp always current

### ✅ Location Tracking
- GPS coordinates stored if permission granted
- Accuracy metric included
- Can be used for geofence verification

### ✅ User Preferences
- Language preference stored
- Permission flags saved
- Can be used for targeted alerts

### ✅ Analytics Ready
- Created/Updated timestamps
- Last seen tracking
- Active/inactive status
- Built-in stats view

---

## 🚀 Next Steps

1. **Run the SQL script** in Supabase to create the table
2. **Update MyPublicWiFi files** with new HTML
3. **Test registration** with a real device
4. **Verify data** appears in Supabase
5. **Build analytics dashboard** (optional)
6. **Integrate with backend** for geofence verification

---

## 🆘 Troubleshooting

### Issue: "Permission denied" in browser console

**Solution:** Check Supabase RLS policies. Make sure anon key has INSERT/UPDATE permissions.

```sql
-- Grant permissions
GRANT INSERT, UPDATE ON wifi_subscriptions TO anon;
```

### Issue: "Unique constraint violation"

**Solution:** This means the phone number already exists. The code should handle this automatically with UPSERT logic.

### Issue: Can't see data in Supabase

**Solution:** 
1. Check browser console for errors
2. Verify table name is `wifi_subscriptions`
3. Verify Supabase URL and keys are correct
4. Check RLS policies allow INSERT

### Issue: Location not being saved

**Solution:**
1. User must grant location permission
2. User must check "Location Tracking" checkbox
3. Browser must support Geolocation API
4. HTTPS required for geolocation (or localhost)

---

## ✅ Success Checklist

- [ ] SQL script run in Supabase
- [ ] Table `wifi_subscriptions` created
- [ ] HTML files updated in MyPublicWiFi
- [ ] Test registration completed
- [ ] Phone number appears in database
- [ ] Location data stored (if enabled)
- [ ] Can query data successfully
- [ ] Browser console shows success messages

---

**You're all set!** Every user who connects to your WiFi will now be automatically stored in Supabase. 🎉
