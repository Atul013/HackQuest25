# 🔧 QUICK FIX: Invalid API Key Error

## The Issue:
You're getting "Invalid API key" because:
1. The anon key in your files is incorrect/truncated
2. The database functions haven't been created yet

## 🚀 QUICK SOLUTION:

### Step 1: Get Correct API Key
1. Go to your **Supabase Dashboard**
2. Click **Settings** → **API**
3. Copy the **`anon public`** key (should look like `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...` but longer)
4. Replace the key in both files:
   - `test-supabase.html` (line ~152)
   - `frontend-supabase-client.js` (line 5)

### Step 2: Create Database Functions FIRST!
**This is crucial - run this in Supabase SQL Editor:**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy the entire content from `supabase-functions.sql`
4. Click **"Run"**
5. You should see: `Supabase-Only Database Functions created successfully! 🎉`

### Step 3: Test Again
1. Refresh your browser at `http://localhost:8080/test-supabase.html`
2. Click **"Test Database Connection"**
3. Should now work! ✅

## 🔍 Alternative: Quick API Key Check

You can also quickly test your API key in the browser console:

```javascript
// Open browser dev tools (F12) and run this:
fetch('https://akblmbpxxotmebzghczj.supabase.co/rest/v1/venues', {
  headers: {
    'apikey': 'YOUR_ANON_KEY_HERE',
    'Authorization': 'Bearer YOUR_ANON_KEY_HERE'
  }
})
.then(r => r.json())
.then(console.log)
```

If this works, your API key is correct!

## 📝 What's Happening:
- **Test without functions**: You can read existing data (venues table)  
- **Test with functions**: You can run custom functions (health_check, admin_login, etc.)

The error suggests either:
1. Wrong API key format
2. Functions not created yet
3. RLS policies blocking access

**Most likely: You need to run the SQL script first!** 🎯