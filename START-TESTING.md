# 🚀 Start Testing - Quick Guide

## Current Status
✅ Backend server is **RUNNING** on port 3000
✅ Connected to Supabase
✅ 3 geofences loaded
✅ All Python dependencies installed

---

## Test the Complete System

### Step 1: Open Haptic Test Page

The page should already be open in your browser. If not, run:

```powershell
start frontend/haptic-test-simple.html
```

**On the page:**
1. Click **"Subscribe to Alerts"** button
2. You should see: "✅ Subscribed successfully!"

---

### Step 2: Start Live Audio Transcription

Open a **NEW PowerShell terminal** and run:

```powershell
cd e:\Projects\HackQuest25\frontend
python model.py
```

**Expected Output:**
```
INFO - Loading Whisper model...
INFO - Whisper model loaded successfully
INFO - Starting live announcement detection...
INFO - Listening for speech...
```

**The system is now listening!** 🎤

---

### Step 3: Test Announcements

Speak these test phrases clearly into your microphone:

#### ✅ SHOULD DETECT (Formal Announcements):

1. **"Attention all passengers, flight AA123 is now boarding at gate 5"**
2. **"Please note that the meeting room on the 3rd floor is now available"**
3. **"All students, kindly proceed to the main hall for the event"**
4. **"Ladies and gentlemen, we are now closing in 10 minutes"**
5. **"Final call for passengers on flight BA456"**

#### ❌ SHOULD IGNORE (Conversations):

1. "I think the meeting went really well today"
2. "Can you help me find the exit?"
3. "This is a really nice building"

---

### Step 4: Verify the Complete Flow

When you speak an announcement, you should see:

**In Python Terminal:**
```
INFO - Speech detected, starting recording...
INFO - Recorded 5.2s of speech
INFO - Transcribing audio...
INFO - Transcription: Attention all passengers...
INFO - Announcement detected: pattern match + score 8.5
✅ ANNOUNCEMENT DETECTED AND SAVED
🚨 Triggering high alert: HELP
✅ Alert triggered successfully
```

**In Backend Terminal:**
```
📳 Haptic Alert Triggered: {
  venueId: '1',
  severity: 'high',
  message: 'Attention all passengers...'
}
🔔 Sending alert to 1 subscribed devices
```

**In Browser (Haptic Test Page):**
- Alert notification appears
- Phone vibrates (if on mobile)
- Visual animation plays

---

## Manual Tests

### Test 1: Test Buttons (Quick Test)

On the haptic test page, click these buttons:

1. **🔔 Test HELP Alert** → Should trigger medium severity
2. **🚨 Test SOS Alert** → Should trigger critical emergency
3. **📢 Test Announcement Alert** → Should play announcement pattern

You should feel vibrations and see console logs.

---

### Test 2: Backend API Health

Run this in PowerShell:

```powershell
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "services": {
    "geofencing": "active",
    "scheduler": "active"
  }
}
```

---

### Test 3: Database Check

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/akblmbpxxotmebzghczj
2. Click **Table Editor**
3. Select **transcriptions** table
4. You should see your announcements saved there

---

## Troubleshooting

### Python model won't start:

**"No module named 'whisper'"**
```powershell
pip install openai-whisper
```

**"Microphone not found"**
- Check Windows Sound Settings
- Ensure microphone is enabled and not muted
- Try unplugging/replugging USB microphone

### Haptic alerts not working:

1. Check that backend is running: `curl http://localhost:3000/health`
2. Click "Subscribe to Alerts" button again
3. Check browser console for errors (F12)
4. Try the test buttons first

### No announcements detected:

1. Speak louder and clearer
2. Use formal announcement language
3. Check Python logs for classification scores
4. Reduce background noise

---

## Expected Performance

| Metric | Target |
|--------|--------|
| Audio Detection | 2-5 seconds |
| Transcription Time | 3-8 seconds |
| API Response | <500ms |
| Alert Delivery | <1 second |
| **Total End-to-End** | **6-15 seconds** |

---

## What's Working

✅ Backend API server running
✅ Supabase database connected
✅ 3 venues loaded with geofences
✅ Haptic alert system functional
✅ WebSocket connections ready
✅ ML model loaded (Whisper base)
✅ Announcement detection active

---

## Next Test: Geofencing

```powershell
start frontend/geofence-map-demo.html
```

1. Allow location access
2. Click "Start Tracking"
3. Your location shows on map
4. Move around to test geofence entry/exit

---

## Support

Having issues? Check:
1. **Backend logs** - In the terminal running `node server.js`
2. **Python logs** - In terminal running `model.py`
3. **Browser console** - Press F12 in browser
4. **Log file** - `frontend/audio_transcription.log`

**Happy Testing! 🎉**
