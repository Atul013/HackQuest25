# 🚀 QUICK REFERENCE - Haptic Alerts & Geofence Testing

## ✅ What's Live

**WiFi Portal:** https://hackquest25.el.r.appspot.com  
**Version:** 20251011t071039

---

## 🎮 New Features

1. **Transcription Monitoring** - Checks every 10 seconds
2. **Haptic Alerts** - Vibration based on priority
3. **Screen Flashing** - Morse code patterns  
4. **Offline Geofence Testing** - Python script (no cloud!)

---

## 🧪 Test Haptic Alerts (3 steps)

### 1. Register
https://hackquest25.el.r.appspot.com

### 2. Create Alert in Supabase
```sql
INSERT INTO temporary_announcements (
    venue_id, transcribed_text, 
    announcement_type, priority, status
) VALUES (
    (SELECT venue_id FROM wifi_subscriptions WHERE phone = '+919876543210'),
    'Test emergency alert!',
    'emergency', 'high', 'active'
);
```

### 3. Watch (within 10 sec)
- 📳 Phone vibrates (SOS)
- 🔴 Screen flashes RED
- 📢 Alert banner shows

---

## 🗺️ Test Geofence (Offline)

### Quick Test
```bash
python test_geofence.py 9.9710 76.2910
```

### All Tests
```bash
python test_geofence.py test
```

### Interactive
```bash
python test_geofence.py
> 9.9710,76.2910
> test
> venues
```

---

## 📊 Priority Mapping

| Priority | Vibration | Screen | Use Case |
|----------|-----------|--------|----------|
| **HIGH** | SOS pattern | RED flash | Emergency |
| **MEDIUM** | Double pulse | ORANGE flash | Warning |
| **LOW** | Single pulse | BLUE flash | Info |

---

## 🔍 Quick Debug

### Check if transcription monitor running:
```javascript
window.transcriptionMonitor.isActive
```

### Manual trigger test:
```javascript
window.hapticService.triggerAlert({
    severity: 'critical',
    type: 'emergency',
    morseMessage: 'SOS'
});
```

### Check user status:
```sql
SELECT phone, venue_id, active 
FROM wifi_subscriptions 
WHERE phone = '+919876543210';
```

---

## 📁 Files

- `transcription-monitor.js` - Polls for announcements
- `test_geofence.py` - Offline geofence testing
- `HAPTIC-ALERTS-COMPLETE.md` - Full documentation

---

**🎯 Everything ready to test! Just need to run SQL files in Supabase first!**
