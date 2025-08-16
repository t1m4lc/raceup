-- Migration script to fix column name issues
-- Run this BEFORE running the main schema.sql

-- First, check if the tables exist and what columns they have
-- If you get errors about tables not existing, that's fine - just continue

-- Fix tickets table - rename user_id to buyer_id if it exists
DO $$
BEGIN
    -- Check if user_id column exists and buyer_id doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'user_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'buyer_id'
    ) THEN
        -- Rename the column
        ALTER TABLE tickets RENAME COLUMN user_id TO buyer_id;
        RAISE NOTICE 'Renamed tickets.user_id to tickets.buyer_id';
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Tickets table does not exist yet - will be created by schema.sql';
END $$;

-- Fix profiles table - rename fullname to full_name if it exists
DO $$
BEGIN
    -- Check if fullname column exists and full_name doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'fullname'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'full_name'
    ) THEN
        -- Rename the column
        ALTER TABLE profiles RENAME COLUMN fullname TO full_name;
        RAISE NOTICE 'Renamed profiles.fullname to profiles.full_name';
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Profiles table does not exist yet - will be created by schema.sql';
END $$;

-- Fix participants table - rename fullname to full_name if it exists
DO $$
BEGIN
    -- Check if fullname column exists and full_name doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'participants' AND column_name = 'fullname'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'participants' AND column_name = 'full_name'
    ) THEN
        -- Rename the column
        ALTER TABLE participants RENAME COLUMN fullname TO full_name;
        RAISE NOTICE 'Renamed participants.fullname to participants.full_name';
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Participants table does not exist yet - will be created by schema.sql';
END $$;

-- Drop existing policies that might reference old column names
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all existing policies on tickets table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'tickets'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON tickets', policy_record.policyname);
        RAISE NOTICE 'Dropped policy % on tickets', policy_record.policyname;
    END LOOP;
    
    -- Drop all existing policies on participants table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'participants'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON participants', policy_record.policyname);
        RAISE NOTICE 'Dropped policy % on participants', policy_record.policyname;
    END LOOP;
    
    -- Drop all existing policies on payments table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'payments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON payments', policy_record.policyname);
        RAISE NOTICE 'Dropped policy % on payments', policy_record.policyname;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop some policies - this is normal if tables do not exist yet';
END $$;

-- Drop old indexes that reference old column names
DROP INDEX IF EXISTS idx_tickets_user_id;

-- Drop existing functions that might conflict
DROP FUNCTION IF EXISTS generate_slug(text);
DROP FUNCTION IF EXISTS clean_slug(text);
DROP FUNCTION IF EXISTS generate_unique_edition_slug(text, uuid);
DROP FUNCTION IF EXISTS generate_unique_event_root_slug(text);
DROP FUNCTION IF EXISTS generate_unique_organization_slug(text);
DROP FUNCTION IF EXISTS generate_unique_race_slug(text, uuid);
DROP FUNCTION IF EXISTS generate_unique_slug(text, text, text);

RAISE NOTICE 'Migration script completed. Now run schema.sql';
