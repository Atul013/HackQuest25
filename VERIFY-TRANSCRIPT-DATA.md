# 🔍 Verify Transcript Test Data in Supabase

## Quick Check - Run in Supabase SQL Editor

### 1. Count Transcripts Per Venue
```sql
SELECT 
    v.name as venue_name,
    COUNT(t.id) as transcript_count
FROM venues v
LEFT JOIN transcriptions t ON v.id = t.venue_id
WHERE t.device_id = 'live_audio_device'
GROUP BY v.name, v.id
ORDER BY v.name;
```

**Expected Output:**
```
venue_name                                      | transcript_count
-----------------------------------------------+------------------
Cochin International Airport                    | 7
Ernakulam Junction Railway Station             | 8
Lulu Mall Kochi                                 | 6
Rajagiri School of Engineering & Technology    | 9
```

### 2. View All Test Transcripts
```sql
SELECT 
    v.name as venue_name,
    t.transcription_text,
    t.announcement_type,
    t.created_at,
    EXTRACT(EPOCH FROM (NOW() - t.created_at))/60 as minutes_ago
FROM transcriptions t
LEFT JOIN venues v ON t.venue_id = v.id
WHERE t.device_id = 'live_audio_device'
ORDER BY t.created_at DESC
LIMIT 30;
```

### 3. Check Most Recent Transcript (Any Venue)
```sql
SELECT 
    v.name as venue_name,
    t.transcription_text,
    t.created_at,
    NOW() - t.created_at as time_ago
FROM transcriptions t
LEFT JOIN venues v ON t.venue_id = v.id
WHERE t.device_id = 'live_audio_device'
ORDER BY t.created_at DESC
LIMIT 1;
```

### 4. Check Specific Venue Transcripts

#### Airport
```sql
SELECT 
    transcription_text, 
    announcement_type, 
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_ago
FROM transcriptions
WHERE venue_id = '08e988d8-6a75-422a-bfe0-0539231c87fb'
  AND device_id = 'live_audio_device'
ORDER BY created_at DESC;
```

#### Railway Station
```sql
SELECT 
    transcription_text, 
    announcement_type, 
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_ago
FROM transcriptions
WHERE venue_id = '2bad79f3-32aa-499f-8de4-2fe07f1a334a'
  AND device_id = 'live_audio_device'
ORDER BY created_at DESC;
```

#### Lulu Mall
```sql
SELECT 
    transcription_text, 
    announcement_type, 
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_ago
FROM transcriptions
WHERE venue_id = '5d03ecd0-e24b-45c8-aa8e-ecf2a6c5a4c6'
  AND device_id = 'live_audio_device'
ORDER BY created_at DESC;
```

#### Rajagiri College
```sql
SELECT 
    transcription_text, 
    announcement_type, 
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_ago
FROM transcriptions
WHERE venue_id = '96ba7dbc-1fe8-491d-99fe-01c04f18d847'
  AND device_id = 'live_audio_device'
ORDER BY created_at DESC;
```

---

## If No Data Found

### Insert Test Data
If the queries above return 0 results, you need to insert the test data:

1. **Open** the file: `test-transcript-data.sql`
2. **Copy** the entire contents
3. **Go to** Supabase Dashboard → SQL Editor
4. **Paste** and **Run** the SQL

The file contains:
- 30 realistic transcripts
- 7 for Airport
- 8 for Railway Station
- 6 for Lulu Mall
- 9 for Rajagiri College

---

## Troubleshooting

### Issue: Foreign Key Violation
**Error**: `insert or update on table "transcriptions" violates foreign key constraint`

**Solution**: Verify venue IDs exist:
```sql
SELECT id, name FROM venues WHERE active = true;
```

If venues don't match, run the venue setup first, then update venue IDs in test-transcript-data.sql.

### Issue: Column Does Not Exist
**Error**: `column "announcement_text" does not exist`

**Solution**: The correct column is `transcription_text`. The webapp now handles both columns for compatibility.

### Issue: Timestamps Too Old
**Problem**: Test data shows "2 hours ago" instead of "2 minutes ago"

**Solution**: Re-run the INSERT statements. They use `NOW() - INTERVAL 'X minutes'` so they'll always be recent.

---

## Expected Results After Fix

### Success Page
✅ Click "View Last 10 Transcripts" → Shows list of 10 transcripts
✅ Each transcript shows venue name (📍 Cochin Airport, etc.)
✅ Timestamps show "X minutes ago"
✅ Demo alert shows actual transcript text

### Main Portal
✅ "Recent Announcements" section populated
✅ Last 10 transcripts visible
✅ Color-coded borders (red/orange/green)
✅ Venue names and timestamps displayed

### Admin Dashboard
✅ "Recent Transcripts (All Venues)" section populated
✅ Dropdown shows all 4 venues
✅ Selecting venue filters the list
✅ Shows up to 50 transcripts

---

## Quick Test URLs

After verifying data exists:

1. **Success Page**: https://hackquest25.el.r.appspot.com/success.html
2. **Main Portal**: https://hackquest25.el.r.appspot.com/
3. **Admin Dashboard**: https://hackquest25.el.r.appspot.com/admin.html

---

## Data Cleanup (Optional)

### Remove ALL Test Transcripts
```sql
DELETE FROM transcriptions 
WHERE device_id = 'live_audio_device';
```

### Remove By Specific Venue
```sql
-- Airport
DELETE FROM transcriptions 
WHERE device_id = 'live_audio_device' 
  AND venue_id = '08e988d8-6a75-422a-bfe0-0539231c87fb';

-- Railway
DELETE FROM transcriptions 
WHERE device_id = 'live_audio_device' 
  AND venue_id = '2bad79f3-32aa-499f-8de4-2fe07f1a334a';

-- Lulu Mall
DELETE FROM transcriptions 
WHERE device_id = 'live_audio_device' 
  AND venue_id = '5d03ecd0-e24b-45c8-aa8e-ecf2a6c5a4c6';

-- Rajagiri
DELETE FROM transcriptions 
WHERE device_id = 'live_audio_device' 
  AND venue_id = '96ba7dbc-1fe8-491d-99fe-01c04f18d847';
```

---

**Last Updated**: October 11, 2025
**Version**: 20251011t081110
