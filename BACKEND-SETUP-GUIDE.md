# 🚀 BACKEND SETUP - Quick Fix Guide

## ✅ What I Just Fixed

1. **Created `.env` file** with Supabase config
2. **Made Redis optional** (no longer required)
3. **Opened haptic test page** (should work now!)

---

## 🔧 What YOU Need to Do

### Step 1: Update Database URL

Open `backend/.env` and replace this line:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

**Find your Supabase credentials:**
1. Go to https://app.supabase.com
2. Open your project
3. Settings → Database
4. Copy the **Connection String (URI)**
5. Paste it in `.env`

Example:
```env
DATABASE_URL=postgresql://postgres:YourPassword123@db.abc123xyz.supabase.co:5432/postgres
```

### Step 2: Restart Backend

```powershell
cd backend
npm start
```

You should see:
```
✅ PostgreSQL connected
🚨 PublicAlert Server Running
📍 Geofencing: ACTIVE
🌐 Port: 3000
```

---

## 🧪 Testing

### 1. Test Haptic Alerts (NO BACKEND NEEDED)

File: `frontend/haptic-test-simple.html` (should be open now!)

**What to do:**
1. Click "Request Permissions" button
2. Allow vibration/notification
3. Click "🚨 Critical Alert (SOS)"
4. **On desktop:** See screen flash white
5. **On mobile:** Feel vibration pattern + screen flash

**Expected behavior:**
- SOS morse code: `... --- ...` (3 short, 3 long, 3 short)
- Screen flashes in sync with vibration
- Activity log shows each step

### 2. Test Admin Dashboard (NEEDS BACKEND)

File: `frontend/admin-dashboard.html`

**Once backend is running:**
1. Open `admin-dashboard.html`
2. Select venue (Ernakulam Junction, Airport, etc.)
3. Choose severity (Critical/Warning)
4. Pick morse code (SOS, HELP, FIRE)
5. Click "Broadcast Alert"

**Expected response:**
```json
{
  "success": true,
  "alert_id": "...",
  "affected_users": 123
}
```

---

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Haptic System | ✅ WORKING | Test with simple version |
| Backend Server | ⚠️ NEEDS CONFIG | Update `.env` with Supabase |
| Admin Dashboard | ⏳ WAITING | Needs backend running |
| ML Model | ✅ WORKING | 87.5% accuracy (teammate's work) |
| Geofencing | ✅ READY | 4 venues configured |
| Database | ⚠️ NEEDS URL | Use Supabase connection string |

---

## ❓ Troubleshooting

### Backend won't start?

**Check 1:** Is `.env` file created?
```powershell
ls backend\.env
```

**Check 2:** Is DATABASE_URL set correctly?
```powershell
cat backend\.env | Select-String DATABASE_URL
```

**Check 3:** Can you connect to Supabase?
Test in your ML code - if `model.py` works, use the same connection string!

### Haptic test not working?

**Desktop:** Only screen flash works (no vibration hardware)
**Mobile:** Need HTTPS or localhost (won't work on file://)

**Solution:** Test on mobile with:
```powershell
# Start a simple HTTP server
cd frontend
python -m http.server 8080

# Open on phone: http://YOUR-PC-IP:8080/haptic-test-simple.html
```

### Admin panel shows "Network Error"?

Backend isn't running! See Step 2 above.

---

## 🎯 Next Steps (For MVP)

1. **Setup Supabase** (update `.env`) ← DO THIS NOW
2. **Test haptic on real phone** (need HTTP server)
3. **Integrate ML with backend** (add POST request in `model.py`)
4. **Test end-to-end flow:**
   - ML detects announcement
   - Sends to backend API
   - Backend finds users in venue
   - Triggers haptic alerts

---

## 📱 Phone Testing (Important!)

Vibration only works:
- ✅ On actual mobile devices
- ✅ Over HTTPS or localhost
- ❌ Not on desktop
- ❌ Not from `file://` on mobile

**To test on phone:**

```powershell
# Option 1: Use ngrok (easiest)
cd frontend
npx http-server -p 8080
# In another terminal:
npx ngrok http 8080
# Opens tunnel like: https://abc123.ngrok.io
# Open that URL on your phone!

# Option 2: Local network (if on same WiFi)
cd frontend
python -m http.server 8080
# Find your PC IP: ipconfig
# Open on phone: http://192.168.X.X:8080/haptic-test-simple.html
```

---

## 🤝 Team Integration

Your teammate has:
- ✅ ML model working (87.5% accuracy)
- ✅ Supabase transcriptions table
- 🔄 QR onboarding (in progress)

You need to:
1. Get their Supabase credentials (for `.env`)
2. Add POST request to their `model.py`:

```python
# Add this to model.py when announcement detected:
if is_announcement(text):
    requests.post('http://localhost:3000/api/haptic-alerts/trigger', json={
        'venue_id': 1,  # Ernakulam Junction, Airport, etc.
        'severity': 'critical',
        'morse_code': 'SOS',
        'message': text
    })
```

---

**Ready to test?** The haptic page should be open - click the red button! 🚨
