# 🧪 Complete System Testing Guide

## Overview
This guide will help you test the **entire HackQuest25 system** including:
1. ✅ Backend API server
2. 🎤 Live audio transcription (ML)
3. 📍 Geofencing system
4. 📳 Haptic alerts
5. 🗄️ Supabase database

---

## Prerequisites Checklist

### Backend Requirements
- [x] Node.js installed
- [x] Backend dependencies installed (`npm install` in backend folder)
- [x] `.env` file configured with Supabase credentials

### Frontend/ML Requirements
- [ ] Python 3.13 installed
- [ ] Python dependencies installed (see below)
- [ ] Microphone access available
- [ ] `.env` file configured in frontend folder

---

## Step 1: Install Python Dependencies

Open a PowerShell terminal in the **frontend** folder:

```powershell
cd e:\Projects\HackQuest25\frontend
```

### Install Required Packages
```powershell
pip install pyaudio
pip install openai-whisper
pip install supabase
pip install python-dotenv
pip install numpy
pip install torch
pip install requests
```

**Note:** Skip `webrtcvad` as it's not compatible with Python 3.13. The code already uses volume-based detection as fallback.

---

## Step 2: Start Backend Server

Open a **new PowerShell terminal** (keep it separate):

```powershell
cd e:\Projects\HackQuest25\backend
node server.js
```

**Expected Output:**
```
✅ Connected to Supabase Database
🚀 Server running on http://localhost:3000
📡 WebSocket server ready
⏰ Geofence scheduler started (polling every 30s)
```

**If you see errors:** Check that your `.env` file in backend folder has correct Supabase credentials.

**Keep this terminal running!**

---

## Step 3: Test Backend Health

In a **new PowerShell terminal**:

```powershell
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-10T...",
  "services": {
    "geofencing": "active",
    "scheduler": "active"
  }
}
```

---

## Step 4: Open Haptic Test Page

In PowerShell:

```powershell
cd e:\Projects\HackQuest25
start frontend/haptic-test-simple.html
```

This opens the haptic alert testing interface in your browser.

### On the Haptic Test Page:

1. **Click "Subscribe to Alerts"** - This registers your device for haptic notifications
2. **Try Test Buttons:**
   - 🔔 Test HELP Alert (Medium Priority)
   - 🚨 Test SOS Alert (Critical Emergency)
   - 📢 Test Announcement Alert

3. **You should feel vibrations** (if on mobile) or see visual feedback

**Keep this page open!**

---

## Step 5: Start Live Audio Transcription

In a **new PowerShell terminal**:

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

**The system is now listening!**

---

## Step 6: Test Announcement Detection

### Test with Real Announcements

Speak clearly into your microphone (wait 1-2 seconds between each):

#### ✅ SHOULD DETECT as Announcement:
1. "Attention all passengers, flight AA123 is now boarding at gate 5"
2. "Please note that the meeting room on the 3rd floor is now available"
3. "All students, kindly proceed to the main hall for the event"
4. "Ladies and gentlemen, we are now closing in 10 minutes"
5. "Final call for passengers on flight BA456"

#### ❌ SHOULD IGNORE as Conversation:
1. "I think the meeting went really well today"
2. "Can you help me find the exit?"
3. "This is a really nice building, isn't it?"
4. "I need to check my flight details"
5. "Maybe we should grab some coffee"

### What to Look For:

**In the Python Terminal:**
```
INFO - Speech detected, starting recording...
INFO - Transcription: Attention all passengers...
INFO - Announcement detected: pattern match + score 8.5
✅ ANNOUNCEMENT DETECTED AND SAVED
🚨 Triggering high alert: HELP
✅ Alert triggered successfully: {...}
```

**In the Backend Terminal:**
```
📳 Haptic Alert Triggered: {
  venueId: '1',
  severity: 'high',
  message: 'Attention all passengers...',
  subscribers: 1
}
🔔 Sending alert to 1 subscribed devices
```

**In Your Browser (Haptic Test Page):**
- You should see a notification appear
- Phone should vibrate (if on mobile)
- Visual alert animation should play

---

## Step 7: Verify Database Entries

Open Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/akblmbpxxotmebzghczj
2. Click **Table Editor**
3. Select **transcriptions** table

You should see entries like:
```
| id | transcription_text | created_at | is_announcement | announcement_type |
|----|-------------------|-----------|-----------------|-------------------|
| 1  | Attention all...  | 2025-10-10| true            | travel            |
```

---

## Step 8: Test Geofencing (Optional)

### Option A: Open Geofence Demo Page
```powershell
start frontend/geofence-map-demo.html
```

1. Click "Start Tracking"
2. Allow location access
3. Your position will be shown on the map
4. Move around to test geofence entry/exit

### Option B: Test Geofencing API Directly

```powershell
# Subscribe to geofence alerts
curl -X POST http://localhost:3000/api/geofence/subscribe -H "Content-Type: application/json" -d '{\"userId\":\"test-user\",\"venueId\":\"1\"}'

# Get user's geofence status
curl http://localhost:3000/api/geofence/status/test-user
```

---

## Troubleshooting

### Python model.py fails to start:

**Error: No module named 'whisper'**
```powershell
pip install openai-whisper
```

**Error: No module named 'supabase'**
```powershell
pip install supabase
```

**Error: No module named 'pyaudio'**
```powershell
pip install pyaudio
```
If this fails on Windows, download the wheel from: https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio

**Error: Microphone not found**
- Check Windows Sound Settings
- Ensure microphone is enabled
- Try unplugging/replugging USB microphone

### Backend not connecting to Supabase:

Check `backend/.env` file has:
```
SUPABASE_URL=https://akblmbpxxotmebzghczj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Haptic alerts not working:

1. Ensure backend is running (`http://localhost:3000`)
2. Click "Subscribe to Alerts" in haptic test page
3. Check backend terminal for subscription confirmation
4. Try the test buttons first before testing with audio

### Announcements not being detected:

1. Speak louder and clearer
2. Reduce background noise
3. Use announcement-style language (formal, public address)
4. Check the logs in Python terminal for classification scores

---

## Complete Test Flow

### The Golden Path Test:

1. ✅ **Start Backend** (`node server.js` in backend folder)
2. ✅ **Open Haptic Test Page** (haptic-test-simple.html)
3. ✅ **Subscribe to Alerts** (click button)
4. ✅ **Start ML Model** (`python model.py` in frontend folder)
5. ✅ **Speak Announcement**: "Attention all passengers, flight AA123 is now boarding"
6. ✅ **Verify Chain:**
   - Python detects announcement ✅
   - Saves to Supabase ✅
   - Triggers backend API ✅
   - Backend sends haptic alert ✅
   - Browser receives & displays alert ✅
   - Phone vibrates ✅

---

## Expected Results Summary

| Component | Status Check |
|-----------|-------------|
| Backend Server | `curl http://localhost:3000/health` returns healthy |
| Python ML Model | Terminal shows "Listening for speech..." |
| Haptic Subscription | Browser console shows "Subscribed successfully" |
| Announcement Detection | Formal speech triggers "ANNOUNCEMENT DETECTED" |
| Haptic Alert Trigger | Backend logs "Haptic Alert Triggered" |
| Database Storage | Supabase table has transcriptions |
| End-to-End Flow | Speaking → Detection → Storage → Alert → Vibration |

---

## Performance Metrics

- **Audio Detection Latency:** 2-5 seconds
- **Transcription Time:** 3-8 seconds (depends on speech length)
- **API Response Time:** <500ms
- **Haptic Alert Delivery:** <1 second
- **Total End-to-End:** 6-15 seconds from speaking to vibration

---

## Next Steps After Testing

1. **Test on Mobile Device** - Transfer haptic-test-simple.html to phone
2. **Test in Real Venue** - Try at airport/conference with real announcements
3. **Fine-tune ML Model** - Adjust detection thresholds in model.py
4. **Add More Venues** - Insert venue data in Supabase
5. **Deploy to Production** - Host backend on cloud service

---

## Support

If you encounter issues:
1. Check all terminals for error messages
2. Verify `.env` files in both backend and frontend folders
3. Ensure all dependencies are installed
4. Check microphone permissions
5. Review logs in `frontend/audio_transcription.log`

**Happy Testing! 🚀**
