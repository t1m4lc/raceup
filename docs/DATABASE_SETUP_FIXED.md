# Database Setup Instructions - UPDATED

## IMPORTANT: Run in this exact order to fix the column errors

### Step 1: Run Migration Script First
1. Go to your Supabase dashboard: https://supabase.com/dashboard/projects
2. Select your project 
3. Go to SQL Editor
4. Copy and run the contents of `supabase/migration.sql` **FIRST**
   - This will rename existing columns and drop conflicting policies

### Step 2: Run Schema Script
5. Then copy and run the contents of `supabase/schema.sql`
   - This will create the tables with correct structure

### Step 3: Run Seed Data
6. Finally, copy and run the contents of `supabase/seed.sql`
   - This will populate the database with test data

## Alternative: Clean Reset (if you have no important data)

If you prefer to start fresh:

1. In Supabase SQL Editor, run:
```sql
-- Drop all tables (WARNING: This deletes all data!)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS races CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```

2. Then run `schema.sql` followed by `seed.sql`

## Test URLs After Setup:
- http://localhost:3001/event/mountain-trail-challenge-2024
- http://localhost:3001/event/city-marathon-2024  
- http://localhost:3001/event/desert-ultra-2024
