-- SAMPLE DATA FOR RACEUP MVP

-- Insert a sample organizer profile
-- Note: You would need to create a user in auth.users first
-- This assumes you have a user with the following UUID
INSERT INTO profiles (id, auth_user_id, fullname, roles)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'AUTH_USER_ID_PLACEHOLDER', 'Event Organizer', '{organizer}');

-- Insert a volunteer profile
INSERT INTO profiles (id, auth_user_id, fullname, roles)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'AUTH_USER_ID_PLACEHOLDER_2', 'Event Volunteer', '{volunteer}');

-- Insert a sample event
INSERT INTO events (id, organizer_id, slug, name, description, start_date, end_date, location, stripe_account_id)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'summer-trail-run-2025',
  'Summer Trail Run 2025',
  'A beautiful summer trail running event with multiple distances.',
  '2025-07-15 08:00:00+00',
  '2025-07-15 18:00:00+00',
  'Forest Park, Portland, OR',
  'acct_STRIPE_ACCOUNT_ID_PLACEHOLDER'
);

-- Associate volunteer with event
INSERT INTO event_volunteers (event_id, volunteer_id)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000002'
);

-- Insert two races for the sample event
INSERT INTO races (id, event_id, slug, name, description, date, distance_km, price_cents, currency, max_participants)
VALUES 
  (
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000010',
    '10k-trail',
    '10K Trail Challenge',
    'A moderate 10K trail run through scenic forest paths.',
    '2025-07-15 09:00:00+00',
    10.0,
    2500,
    'EUR',
    200
  ),
  (
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000010',
    'half-marathon-trail',
    'Half Marathon Trail Adventure',
    'A challenging 21K trail run with elevation gain and technical sections.',
    '2025-07-15 08:00:00+00',
    21.1,
    4500,
    'EUR',
    150
  );

-- To use this seed file in your actual database:
-- 1. Replace AUTH_USER_ID_PLACEHOLDER with actual auth.users.id values
-- 2. Replace STRIPE_ACCOUNT_ID_PLACEHOLDER with a real Stripe Connect account ID
-- 3. Adjust dates as needed
