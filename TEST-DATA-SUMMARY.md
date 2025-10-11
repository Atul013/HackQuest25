# 🎯 Test Transcript Data - Ready to Run!

## 📊 What's Included

### **30 Realistic Test Transcripts** across all 4 venues:

| Venue | Transcripts | Types |
|-------|-------------|-------|
| 🛫 **Cochin International Airport** | 7 | Flights, security, delays, boarding |
| 🚂 **Ernakulam Junction Railway Station** | 8 | Trains, platforms, schedules, lost & found |
| 🏬 **Lulu Mall Kochi** | 6 | Offers, parking, lost child, security |
| 🎓 **Rajagiri School of Engineering** | 9 | Classes, events, transport, library |

### **Total: 30 transcripts** (5-10 per venue as requested)

---

## 📋 Venue IDs Used

```
Airport:         08e988d8-6a75-422a-bfe0-0539231c87fb
Railway Station: 2bad79f3-32aa-499f-8de4-2fe07f1a334a
Lulu Mall:       5d03ecd0-e24b-45c8-aa8e-ecf2a6c5a4c4
Rajagiri:        96ba7dbc-1fe8-491d-99fe-01c04f18d847
```

---

## ⏰ Time Distribution

Transcripts are spread across different times:
- **Most recent**: 1-2 minutes ago
- **Recent**: 5-15 minutes ago
- **Older**: 20-60 minutes ago

This creates a realistic history for testing the "Last 10 Transcripts" feature.

---

## 📱 Announcement Types

- **transport**: Flight/train schedules, platform changes
- **security**: Baggage alerts, suspicious activity warnings
- **emergency**: Fire drills, evacuation procedures
- **general**: Lost & found, offers, notifications
- **maintenance**: Closures, repair work

---

## 🚀 How to Run

### Step 1: Add venue_id column (if not done)
```sql
-- Run add-venue-to-transcriptions.sql first
ALTER TABLE transcriptions 
ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transcriptions_venue_id ON transcriptions(venue_id);
```

### Step 2: Insert test data
1. Open `test-transcript-data.sql`
2. Copy the entire file
3. Paste into Supabase SQL Editor
4. Execute

### Step 3: Verify
The SQL file includes verification queries that will show:
- Count of transcripts per venue
- All transcripts with venue names and timestamps
- Transcripts grouped by specific venue

---

## ✅ Expected Results

After running the SQL, you should see:

**Count by venue:**
```
Cochin International Airport:              7 transcripts
Ernakulam Junction Railway Station:        8 transcripts
Lulu Mall Kochi:                           6 transcripts
Rajagiri School of Engineering & Tech:     9 transcripts
```

**Total:** 30 test transcripts

---

## 🧪 Testing the Feature

### On Success Page
1. Register at: https://hackquest25.el.r.appspot.com
2. Make sure you're in one of the geofenced venues
3. After registration:
   - **Demo alert** will show the LATEST transcript from your venue
   - Click **"📜 View Last 10 Transcripts"** to see transcript history

### Expected Behavior

**For Rajagiri users:**
- Demo alert shows: "Class notification: Computer Science students..." (most recent)
- Transcript history shows up to 9 transcripts

**For Railway Station users:**
- Demo alert shows: "Platform announcement: Train number 12617..." (most recent)
- Transcript history shows up to 8 transcripts

**For Airport users:**
- Demo alert shows: "Flight announcement: Air India flight AI123..." (most recent)
- Transcript history shows up to 7 transcripts

**For Lulu Mall users:**
- Demo alert shows: "Special offer: Flat 50% discount..." (most recent)
- Transcript history shows up to 6 transcripts

---

## 🗑️ Cleanup

To remove all test data:
```sql
DELETE FROM transcriptions WHERE device_id = 'live_audio_device';
```

Or remove by specific venue (examples in the SQL file).

---

## 📝 Sample Transcripts Preview

### Airport 🛫
- "Flight announcement: Air India flight AI123 to Mumbai is now boarding at Gate 5."
- "Security alert: Please do not leave your baggage unattended..."
- "Flight update: IndiGo flight 6E456 to Delhi has been delayed..."

### Railway Station 🚂
- "Platform announcement: Train number 12617 Mangala Express..."
- "Platform change: Train number 12625 Kerala Express will now depart..."
- "Lost and found: A black backpack has been found on Platform 2..."

### Lulu Mall 🏬
- "Special offer: Flat 50% discount on all electronics..."
- "Lost child announcement: A 4-year-old girl wearing a pink dress..."
- "Parking announcement: Red zone parking is almost full..."

### Rajagiri 🎓
- "Class notification: Computer Science students - Advanced AI lecture..."
- "Event announcement: Tech fest registration is now open..."
- "Transport update: College bus departure time has been changed..."

---

## ✨ Ready to Test!

The file is complete and ready to run. All venue IDs are correct and match your actual database records. Just copy, paste, and execute in Supabase SQL Editor!
