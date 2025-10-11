# ⚠️ IMPORTANT: Venue ID Column Name

## Database Structure Clarification

### Venues Table
The `venues` table uses **`id`** as its primary key column (UUID), **NOT** `venue_id`.

```sql
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- ← Primary key is 'id'
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    -- ... other columns
);
```

### Foreign Key References
Other tables reference the venues table using `venue_id` as the foreign key column name, but it points to `venues(id)`:

```sql
-- wifi_subscriptions table
venue_id UUID REFERENCES venues(id) ON DELETE SET NULL

-- transcriptions table (newly added)
venue_id UUID REFERENCES venues(id) ON DELETE SET NULL
```

### JavaScript Code
When querying venues directly, use `id`:
```javascript
// ✅ Correct
SELECT id, name FROM venues;

// ❌ Wrong  
SELECT venue_id, name FROM venues;
```

When querying through relationships, use `venue_id`:
```javascript
// ✅ Correct
SELECT venue_id FROM wifi_subscriptions WHERE phone = '...';
```

### In Your Queries

**Get venue list:**
```sql
SELECT id, name FROM venues;  -- Use 'id', not 'venue_id'
```

**Get user's venue:**
```sql
SELECT venue_id FROM wifi_subscriptions WHERE phone = '+919876543210';
-- Returns the venue_id which corresponds to venues.id
```

**Insert test transcript:**
```sql
INSERT INTO transcriptions (transcription_text, venue_id, ...)
VALUES ('Test', 'abc-123-def-456', ...);  -- venue_id value comes from venues.id
```

---

## Quick Reference

| Table | Column Name | Type | Description |
|-------|-------------|------|-------------|
| `venues` | `id` | UUID | Primary key of venues table |
| `wifi_subscriptions` | `venue_id` | UUID | Foreign key → venues(id) |
| `transcriptions` | `venue_id` | UUID | Foreign key → venues(id) |

---

## Fixed SQL Files

✅ **`add-venue-to-transcriptions.sql`** - Now correctly references `venues(id)`
✅ **`test-transcript-data.sql`** - Updated to query `id` from venues table

---

## Summary

- Venues table primary key = **`id`**
- Other tables foreign key column = **`venue_id`** → points to **`venues(id)`**
- When selecting from venues table directly, use **`id`**
- When selecting from other tables, use **`venue_id`**
