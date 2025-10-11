# Quick Start Guide - Transcript History Feature

## 🚀 3-Step Setup

### Step 1: Add Venue Column to Database
Open Supabase SQL Editor and run:
```sql
ALTER TABLE transcriptions 
ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(venue_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transcriptions_venue_id ON transcriptions(venue_id);
```

### Step 2: Add Test Data
1. Get a venue_id:
```sql
SELECT venue_id, name FROM venues LIMIT 1;
```

2. Open `test-transcript-data.sql`
3. Replace `'YOUR_VENUE_ID_HERE'` with actual venue_id
4. Run the SQL to insert 10 test transcripts

### Step 3: Test on Live Site
1. Visit: https://hackquest25.el.r.appspot.com
2. Register with phone number
3. On success page, wait 3 seconds → Demo alert shows LATEST transcript
4. Click "📜 View Last 10 Transcripts" → Modal shows transcript history

---

## ✅ What Changed

### Success Page (success.html)
- **Demo Alert**: Now shows latest transcript instead of "Welcome to AlertNet!"
- **New Button**: "📜 View Last 10 Transcripts" 
- **Modal**: Displays recent transcripts with timestamps

### Database
- **New Column**: `transcriptions.venue_id` (UUID, foreign key to venues)
- **Index**: Fast queries by venue

---

## 📋 Files Created

1. **`add-venue-to-transcriptions.sql`** - Add venue column to database
2. **`test-transcript-data.sql`** - Insert 10 test transcripts
3. **`TRANSCRIPT-HISTORY-FEATURE.md`** - Complete documentation

---

## 🎯 How It Works

### Demo Alert on Registration Success
```
User registers → Success page loads
After 3 seconds:
  1. Fetch user's venue_id
  2. Query latest transcript for that venue
  3. Show in haptic alert (with vibration + flash)
  4. If no transcript found → Show default welcome message
```

### Transcript History Button
```
User clicks "View Last 10 Transcripts"
  1. Open modal
  2. Fetch user's venue_id from localStorage or wifi_subscriptions
  3. Query last 10 transcripts WHERE venue_id = user's venue
  4. Display with timestamps and text
  5. If no venue → Show "You are not in any venue"
  6. If no transcripts → Show "No transcripts available"
```

---

## 🧪 Quick Test

### Browser Console Commands
```javascript
// Show transcript history
showTranscriptHistory();

// Get latest transcript
getLatestTranscript().then(text => console.log(text));

// Close modal
closeTranscriptModal();
```

### SQL Queries
```sql
-- Check transcripts for a venue
SELECT t.*, v.name 
FROM transcriptions t
LEFT JOIN venues v ON t.venue_id = v.venue_id
ORDER BY t.created_at DESC
LIMIT 10;

-- Count transcripts per venue
SELECT v.name, COUNT(t.id) as transcript_count
FROM venues v
LEFT JOIN transcriptions t ON v.venue_id = t.venue_id
GROUP BY v.name;
```

---

## ⚠️ Important Notes

1. **Venue ID Required**: Users must be in a geofenced venue to see transcripts
2. **Real Transcription System**: When your live audio system creates transcriptions, it MUST include `venue_id`
3. **Test Data**: Use provided SQL file to create test transcripts for demo

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "You are not in any venue" | Ensure user registered in a geofenced area |
| "No transcripts available" | Run `test-transcript-data.sql` to add test data |
| Modal not opening | Check browser console for errors |
| Generic welcome message in alert | No transcripts exist for user's venue |

---

## 📞 Support

Check logs in browser console:
- "✅ Supabase client initialized"
- "📍 Fetching transcripts for venue: [id]"
- "📢 Latest transcript: [text]"

---

## 🎉 Expected Results

### Success Page Demo Alert (after 3 seconds):
- 🟠 Orange screen flash (2x Morse code)
- 📳 Double pulse vibration (2x)
- ⚠️ Banner with LATEST transcript text (not generic message)
- 🔔 Web notification

### Transcript History Modal:
- 📜 Title: "Recent Transcripts"
- 📋 List of 10 transcripts with timestamps
- ✅ Each shows date/time + full text
- ❌ Close button

---

## Deployment Info

- **URL**: https://hackquest25.el.r.appspot.com/success.html
- **Version**: 20251011t073516
- **Status**: ✅ Live and ready for testing
