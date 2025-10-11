# 🔧 Fix: Missing polygon_coordinates Column

## Problem
When running `kochi-venues-setup.sql` in Supabase, you got this error:
```
ERROR: column "polygon_coordinates" of relation "venues" does not exist
```

## Root Cause
The `venues` table in your Supabase database was created with the original schema (from `supabase-setup.sql`) which only supports **circular geofencing** with radius.

It doesn't have the `polygon_coordinates` column needed for **complex polygon geofencing**.

## Solution
Run the migration script **BEFORE** running the venues setup:

### Step 1: Add the Polygon Column
1. Open Supabase SQL Editor:
   ```
   https://app.supabase.com/project/akblmbpxxotmebzghczj/editor
   ```

2. Run this file FIRST:
   ```
   E:\Projects\HackQuest25\add-polygon-column.sql
   ```

3. Wait for success message:
   ```
   ✅ polygon_coordinates column added!
   ```

### Step 2: Insert Venue Data
4. Now run the venues setup file:
   ```
   E:\Projects\HackQuest25\kochi-venues-setup.sql
   ```

5. Verify 4 venues created:
   ```sql
   SELECT name, type, 
          CASE WHEN polygon_coordinates IS NOT NULL THEN 'Polygon' ELSE 'Circle' END as geofence_type
   FROM venues WHERE active = true;
   ```

## What Changed

### Before (Original Schema)
```sql
CREATE TABLE venues (
    ...
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius INTEGER NOT NULL DEFAULT 100,  -- Only circular geofencing
    ...
);
```

### After (With Migration)
```sql
CREATE TABLE venues (
    ...
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius INTEGER NOT NULL DEFAULT 100,  -- Fallback circular geofencing
    polygon_coordinates DECIMAL(10,8)[][], -- Complex polygon boundaries (NEW!)
    ...
);
```

## Why Both radius AND polygon_coordinates?

The system uses a **dual-mode approach**:

1. **Primary**: Check if point is inside `polygon_coordinates` (accurate)
2. **Fallback**: If polygon is NULL, use circular `radius` check (simple)

This gives you:
- ✅ **Accuracy**: Precise boundaries for complex venues (airports, malls)
- ✅ **Simplicity**: Quick radius checks for simple venues
- ✅ **Backward compatibility**: Existing radius-based venues still work

## Quick Test After Migration

```sql
-- Test the new column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'venues' 
  AND column_name = 'polygon_coordinates';

-- Should return:
-- polygon_coordinates | ARRAY
```

## Files Created

1. **add-polygon-column.sql** - Migration script (run this first)
2. **kochi-venues-setup.sql** - Venue data with accurate polygons (run second)

## Next Steps

After running both SQL files in order:

1. ✅ Database schema updated
2. ✅ 4 venues created with accurate KML polygons
3. 🔄 Deploy frontend with location-monitor.js
4. 🧪 Test registration and geofence detection

---

**TL;DR**: Run `add-polygon-column.sql` first, then `kochi-venues-setup.sql` second. Problem solved! 🎯
