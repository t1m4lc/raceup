-- RaceUp MVP Database Schema

-- PROFILES TABLE
-- Extends the auth.users table with additional profile information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fullname TEXT NOT NULL,
  roles TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (auth_user_id)
);

CREATE INDEX profiles_auth_user_id_idx ON profiles (auth_user_id);
CREATE INDEX profiles_roles_idx ON profiles USING GIN (roles);

-- EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  stripe_account_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX events_organizer_id_idx ON events (organizer_id);
CREATE INDEX events_slug_idx ON events (slug);

-- RACES TABLE
CREATE TABLE IF NOT EXISTS races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  distance_km DECIMAL(10, 2) NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  max_participants INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (event_id, slug)
);

CREATE INDEX races_event_id_idx ON races (event_id);
CREATE INDEX races_slug_idx ON races (slug);

-- EVENT_VOLUNTEERS TABLE
-- Junction table for volunteers assigned to events
CREATE TABLE IF NOT EXISTS event_volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (event_id, volunteer_id)
);

CREATE INDEX event_volunteers_event_id_idx ON event_volunteers (event_id);
CREATE INDEX event_volunteers_volunteer_id_idx ON event_volunteers (volunteer_id);

-- TICKETS TABLE
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL REFERENCES races(id) ON DELETE RESTRICT,
  purchaser_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  total_price_cents INTEGER NOT NULL CHECK (total_price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'canceled', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX tickets_race_id_idx ON tickets (race_id);
CREATE INDEX tickets_purchaser_id_idx ON tickets (purchaser_id);
CREATE INDEX tickets_stripe_payment_intent_id_idx ON tickets (stripe_payment_intent_id);
CREATE INDEX tickets_status_idx ON tickets (status);

-- PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  fullname TEXT NOT NULL,
  birthdate DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  certificate_validated BOOLEAN DEFAULT FALSE,
  certificate_url TEXT,
  checkin_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX participants_ticket_id_idx ON participants (ticket_id);
CREATE INDEX participants_checkin_at_idx ON participants (checkin_at) WHERE checkin_at IS NOT NULL;

-- PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  application_fee_cents INTEGER NOT NULL CHECK (application_fee_cents >= 0),
  stripe_payment_intent_id TEXT NOT NULL,
  stripe_payment_method TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (stripe_payment_intent_id)
);

CREATE INDEX payments_ticket_id_idx ON payments (ticket_id);
CREATE INDEX payments_stripe_payment_intent_id_idx ON payments (stripe_payment_intent_id);
CREATE INDEX payments_status_idx ON payments (status);

-- ROW LEVEL SECURITY POLICIES

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- EVENTS POLICIES
-- Organizers can manage their events
CREATE POLICY events_select_all ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY events_manage_as_organizer ON events
  FOR ALL
  USING (organizer_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- RACES POLICIES
CREATE POLICY races_select_all ON races
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY races_manage_as_organizer ON races
  FOR ALL
  USING (event_id IN (SELECT id FROM events WHERE organizer_id IN 
    (SELECT id FROM profiles WHERE auth_user_id = auth.uid())));

-- EVENT_VOLUNTEERS POLICIES
CREATE POLICY event_volunteers_select_as_organizer ON event_volunteers
  FOR SELECT
  USING (event_id IN (SELECT id FROM events WHERE organizer_id IN 
    (SELECT id FROM profiles WHERE auth_user_id = auth.uid())));

CREATE POLICY event_volunteers_select_as_volunteer ON event_volunteers
  FOR SELECT
  USING (volunteer_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY event_volunteers_manage_as_organizer ON event_volunteers
  FOR ALL
  USING (event_id IN (SELECT id FROM events WHERE organizer_id IN 
    (SELECT id FROM profiles WHERE auth_user_id = auth.uid())));

-- TICKETS POLICIES
CREATE POLICY tickets_select_as_purchaser ON tickets
  FOR SELECT
  USING (purchaser_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY tickets_select_as_organizer ON tickets
  FOR SELECT
  USING (race_id IN (SELECT id FROM races WHERE event_id IN 
    (SELECT id FROM events WHERE organizer_id IN 
      (SELECT id FROM profiles WHERE auth_user_id = auth.uid()))));

CREATE POLICY tickets_select_as_volunteer ON tickets
  FOR SELECT
  USING (race_id IN (SELECT id FROM races WHERE event_id IN 
    (SELECT id FROM event_volunteers WHERE volunteer_id IN 
      (SELECT id FROM profiles WHERE auth_user_id = auth.uid()))));

CREATE POLICY tickets_insert_as_purchaser ON tickets
  FOR INSERT
  WITH CHECK (purchaser_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- PARTICIPANTS POLICIES
CREATE POLICY participants_select_as_purchaser ON participants
  FOR SELECT
  USING (ticket_id IN (SELECT id FROM tickets WHERE purchaser_id IN 
    (SELECT id FROM profiles WHERE auth_user_id = auth.uid())));

CREATE POLICY participants_select_as_organizer ON participants
  FOR SELECT
  USING (ticket_id IN (SELECT id FROM tickets WHERE race_id IN 
    (SELECT id FROM races WHERE event_id IN 
      (SELECT id FROM events WHERE organizer_id IN 
        (SELECT id FROM profiles WHERE auth_user_id = auth.uid())))));

CREATE POLICY participants_select_as_volunteer ON participants
  FOR SELECT
  USING (ticket_id IN (SELECT id FROM tickets WHERE race_id IN 
    (SELECT id FROM races WHERE event_id IN 
      (SELECT id FROM event_volunteers WHERE volunteer_id IN 
        (SELECT id FROM profiles WHERE auth_user_id = auth.uid())))));

CREATE POLICY participants_insert_as_purchaser ON participants
  FOR INSERT
  WITH CHECK (ticket_id IN (SELECT id FROM tickets WHERE purchaser_id IN 
    (SELECT id FROM profiles WHERE auth_user_id = auth.uid())));

CREATE POLICY participants_update_as_volunteer ON participants
  FOR UPDATE
  USING (ticket_id IN (SELECT id FROM tickets WHERE race_id IN 
    (SELECT id FROM races WHERE event_id IN 
      (SELECT id FROM event_volunteers WHERE volunteer_id IN 
        (SELECT id FROM profiles WHERE auth_user_id = auth.uid())))));

-- PAYMENTS POLICIES
CREATE POLICY payments_select_as_purchaser ON payments
  FOR SELECT
  USING (ticket_id IN (SELECT id FROM tickets WHERE purchaser_id IN 
    (SELECT id FROM profiles WHERE auth_user_id = auth.uid())));

CREATE POLICY payments_select_as_organizer ON payments
  FOR SELECT
  USING (ticket_id IN (SELECT id FROM tickets WHERE race_id IN 
    (SELECT id FROM races WHERE event_id IN 
      (SELECT id FROM events WHERE organizer_id IN 
        (SELECT id FROM profiles WHERE auth_user_id = auth.uid())))));

-- FUNCTIONS

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_events_timestamp
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_races_timestamp
BEFORE UPDATE ON races
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_tickets_timestamp
BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_participants_timestamp
BEFORE UPDATE ON participants
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_payments_timestamp
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
