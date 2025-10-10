# 🚀 FINAL INSTALLATION STEPS

## ⚠️ IMPORTANT: Run as Administrator

The installation is ready but needs admin privileges to copy files to Program Files.

### **STEP 1: Install WiFi Portal Files**

1. Navigate to: `E:\Projects\HackQuest25\wififrontend\`
2. Right-click on: **`INSTALL-NOW.bat`**
3. Select: **"Run as administrator"**
4. The script will:
   - ✓ Backup your existing login.html and style.css
   - ✓ Copy login-mypublicwifi.html → login.html
   - ✓ Copy style-modern.css → style.css
   - ✓ Copy success.html
   - ✓ Verify Supabase integration
5. Wait for "INSTALLATION COMPLETE!" message
6. Press any key to close

---

### **STEP 2: Create Supabase Database Table**

The table creation is already in progress (browser window should be open):

1. **Supabase Dashboard** should already be open in your browser
2. Click: **SQL Editor** (left sidebar)
3. Click: **New Query**
4. **Notepad** should also be open with `supabase-wifi-subscriptions.sql`
5. **Copy** all the SQL from Notepad
6. **Paste** into Supabase SQL Editor
7. Click: **Run** (or press Ctrl+Enter)
8. You should see: ✓ "Success. No rows returned"

---

### **STEP 3: Verify Everything Works**

After completing steps 1 & 2, verify the installation:

```powershell
# Run this in PowerShell:
$file = "C:\Program Files (x86)\MyPublicWiFi\Web\login.html"
$content = Get-Content $file -Raw
Write-Host "File Size: $([math]::Round((Get-Item $file).Length/1024, 2)) KB"
if ($content -match "supabase") { Write-Host "✓ Supabase: OK" -ForegroundColor Green }
if ($content -match "validateAndSubmit") { Write-Host "✓ Geolocation: OK" -ForegroundColor Green }
```

Expected output:
- File Size: ~22.6 KB (not 12.7 KB)
- ✓ Supabase: OK
- ✓ Geolocation: OK

---

### **STEP 4: Test on Mobile Device**

1. Make sure **MyPublicWiFi** is running
2. Connect to your WiFi hotspot from a mobile device
3. Browser should open automatically with AlertNet registration
4. Fill in:
   - Phone number (country code defaults to +91)
   - Select language
   - Check both permission boxes
5. Click "Register"
6. Allow location access when prompted
7. Should redirect to green success page with your info
8. Check Supabase dashboard → **Table Editor** → **wifi_subscriptions**
9. Your phone number should appear in the table!

---

## 🐛 Troubleshooting

**If files don't copy:**
- Make sure you right-clicked and selected "Run as administrator"
- Check if MyPublicWiFi is running (shouldn't matter, but worth checking)
- Try closing any open browsers viewing the old portal

**If Supabase SQL fails:**
- Make sure you're logged into the correct project
- Check if `venues` table exists (required for foreign key)
- Try running the SQL in sections if there's an error

**If mobile test doesn't show new portal:**
- Clear browser cache on mobile device
- Try accessing: http://192.168.173.1/ directly
- Check if login.html was actually updated (run verification command)

---

## 📁 File Locations

**Source Files (Your Project):**
- `E:\Projects\HackQuest25\wififrontend\login-mypublicwifi.html` (23 KB - has Supabase)
- `E:\Projects\HackQuest25\wififrontend\style-modern.css`
- `E:\Projects\HackQuest25\wififrontend\success.html`

**Destination (MyPublicWiFi):**
- `C:\Program Files (x86)\MyPublicWiFi\Web\login.html` (currently 12.7 KB - OLD)
- `C:\Program Files (x86)\MyPublicWiFi\Web\style.css`
- `C:\Program Files (x86)\MyPublicWiFi\Web\success.html`

**Backups Created:**
- `C:\Program Files (x86)\MyPublicWiFi\Web\login_backup_YYYYMMDD.html`
- `C:\Program Files (x86)\MyPublicWiFi\Web\style_backup_YYYYMMDD.css`

---

## ✅ What's Been Done Automatically

- ✅ Created AlertNet WiFi portal HTML (login-mypublicwifi.html)
- ✅ Created modern CSS styling (style-modern.css)
- ✅ Created success page (success.html)
- ✅ Integrated Supabase JS client
- ✅ Added geolocation API with high accuracy
- ✅ Created database schema SQL file
- ✅ Opened Supabase dashboard in browser
- ✅ Opened SQL file in Notepad
- ✅ Created installation batch file

## ⏳ What You Need to Do

1. **Right-click** `INSTALL-NOW.bat` → **Run as administrator** (2 minutes)
2. **Paste SQL** in Supabase and click Run (1 minute)
3. **Test** on mobile device (2 minutes)

**Total time needed: ~5 minutes**

---

*Once these 3 steps are complete, your AlertNet WiFi portal will be fully operational!* 🎉
