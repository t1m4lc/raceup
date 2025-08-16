-- RaceUp Database Schema
-- This file creates the necessary tables and policies for the race ticketing platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security on all tables by default
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female')),
    phone_number TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    founder_id UUID REFERENCES profiles(id) NOT NULL,
    volunteers UUID[] DEFAULT '{}',
    stripe_account_id TEXT,
    logo_url TEXT,
    banner_url TEXT,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    previous_event_id UUID REFERENCES events(id),
    logo_url TEXT,
    banner_url TEXT,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create races table
CREATE TABLE IF NOT EXISTS races (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    distance_km DECIMAL NOT NULL,
    elevation_m INTEGER,
    start_time TIMESTAMPTZ NOT NULL,
    price_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'EUR' NOT NULL,
    max_participants INTEGER,
    slug TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, slug)
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    race_id UUID REFERENCES races(id) NOT NULL,
    buyer_id UUID REFERENCES profiles(id) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price_cents INTEGER NOT NULL,
    stripe_payment_intent_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    gender TEXT NOT NULL,
    birthdate DATE NOT NULL,
    certificate_url TEXT,
    certificate_validated BOOLEAN DEFAULT FALSE,
    checkin_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID REFERENCES tickets(id) NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    amount_cents INTEGER NOT NULL,
    application_fee_cents INTEGER NOT NULL,
    commission_fixed_cents INTEGER,
    commission_variable_cents INTEGER,
    commission_allocation JSONB,
    stripe_payment_method TEXT,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be refined later)

-- Profiles: Users can read all profiles, update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Organizations: Everyone can read, founders can update their own
CREATE POLICY "Organizations are viewable by everyone" ON organizations FOR SELECT USING (true);
CREATE POLICY "Founders can update their organizations" ON organizations FOR UPDATE USING (auth.uid() = founder_id);
CREATE POLICY "Authenticated users can create organizations" ON organizations FOR INSERT WITH CHECK (auth.uid() = founder_id);

-- Events: Everyone can read, organization founders can manage
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Organization founders can manage events" ON events FOR ALL USING (
    EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = organization_id AND o.founder_id = auth.uid()
    )
);

-- Races: Everyone can read, event organization founders can manage
CREATE POLICY "Races are viewable by everyone" ON races FOR SELECT USING (true);
CREATE POLICY "Event organization founders can manage races" ON races FOR ALL USING (
    EXISTS (
        SELECT 1 FROM events e
        JOIN organizations o ON o.id = e.organization_id
        WHERE e.id = event_id AND o.founder_id = auth.uid()
    )
);

-- Tickets: Users can see their own tickets, organization founders can see tickets for their events
CREATE POLICY "Users can view their own tickets" ON tickets FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Organization founders can view tickets for their events" ON tickets FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM races r
        JOIN events e ON e.id = r.event_id
        JOIN organizations o ON o.id = e.organization_id
        WHERE r.id = race_id AND o.founder_id = auth.uid()
    )
);
CREATE POLICY "Authenticated users can create tickets" ON tickets FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Participants: Users can manage participants for their tickets, organization founders can view participants for their events
CREATE POLICY "Users can manage participants for their tickets" ON participants FOR ALL USING (
    EXISTS (
        SELECT 1 FROM tickets t
        WHERE t.id = ticket_id AND t.buyer_id = auth.uid()
    )
);
CREATE POLICY "Organization founders can view participants for their events" ON participants FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM tickets t
        JOIN races r ON r.id = t.race_id
        JOIN events e ON e.id = r.event_id
        JOIN organizations o ON o.id = e.organization_id
        WHERE t.id = ticket_id AND o.founder_id = auth.uid()
    )
);

-- Payments: Users can view their own payments, organization founders can view payments for their events
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM tickets t
        WHERE t.id = ticket_id AND t.buyer_id = auth.uid()
    )
);
CREATE POLICY "Organization founders can view payments for their events" ON payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM tickets t
        JOIN races r ON r.id = t.race_id
        JOIN events e ON e.id = r.event_id
        JOIN organizations o ON o.id = e.organization_id
        WHERE t.id = ticket_id AND o.founder_id = auth.uid()
    )
);

-- Create utility functions for slug generation
-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS generate_slug(text);
DROP FUNCTION IF EXISTS clean_slug(text);
DROP FUNCTION IF EXISTS generate_unique_edition_slug(text, uuid);
DROP FUNCTION IF EXISTS generate_unique_event_root_slug(text);
DROP FUNCTION IF EXISTS generate_unique_organization_slug(text);
DROP FUNCTION IF EXISTS generate_unique_race_slug(text, uuid);
DROP FUNCTION IF EXISTS generate_unique_slug(text, text, text);

CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                regexp_replace(input_text, '[àáâãäå]', 'a', 'gi'),
                '[èéêë]', 'e', 'gi'
            ),
            '[^a-z0-9]+', '-', 'gi'
        )
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION clean_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN trim(both '-' from generate_slug(input_text));
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add some indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_races_event_id ON races(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_buyer_id ON tickets(buyer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_race_id ON tickets(race_id);
CREATE INDEX IF NOT EXISTS idx_participants_ticket_id ON participants(ticket_id);
CREATE INDEX IF NOT EXISTS idx_payments_ticket_id ON payments(ticket_id);

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();