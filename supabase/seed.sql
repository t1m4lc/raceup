-- Seed script that uses existing user and creates test data
-- Run this in Supabase SQL Editor AFTER running schema.sql

-- Skip Step 1: Using existing auth user f7bbe398-2d2e-4140-ae04-3afd24c11533

-- Step 2: Create corresponding profile for existing user (if not exists)
INSERT INTO profiles (id, full_name, email, phone, created_at, updated_at) VALUES
('f7bbe398-2d2e-4140-ae04-3afd24c11533', 'Test User', 'test@example.com', '+33123456789', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create organizations (handle duplicates)
INSERT INTO organizations (id, name, description, founder_id, volunteers, stripe_account_id, slug, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Trail Runners Club', 'A community of passionate trail runners exploring mountain paths', 'f7bbe398-2d2e-4140-ae04-3afd24c11533', ARRAY[]::UUID[], 'acct_test_trailrunners', 'trail-runners-club', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'Marathon Society', 'Dedicated to organizing professional marathon events', 'f7bbe398-2d2e-4140-ae04-3afd24c11533', ARRAY[]::UUID[], 'acct_test_marathon', 'marathon-society', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'Ultra Challenge', 'Extreme endurance events for the brave', 'f7bbe398-2d2e-4140-ae04-3afd24c11533', ARRAY[]::UUID[], 'acct_test_ultra', 'ultra-challenge', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  founder_id = EXCLUDED.founder_id,
  updated_at = NOW();

-- Step 4: Create events with previous_event_id relationships and slugs (handle duplicates)
INSERT INTO events (id, organization_id, name, description, start_date, end_date, location, previous_event_id, slug, created_at, updated_at) VALUES
-- Trail Runners Club events (past events)
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Mountain Trail Challenge 2023', 'Annual mountain trail running event', '2023-06-15 08:00:00+00', '2023-06-15 18:00:00+00', 'Alps, France', NULL, 'mountain-trail-challenge-2023', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Mountain Trail Challenge 2024', 'Second edition of our mountain trail event', '2024-06-15 08:00:00+00', '2024-06-15 18:00:00+00', 'Alps, France', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'mountain-trail-challenge-2024', NOW(), NOW()),

-- NEW 2025 Trail Runners Club event (OPEN FOR REGISTRATION)
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Mountain Trail Challenge 2025', 'Third edition of our mountain trail event', '2025-10-15 08:00:00+00', '2025-10-15 18:00:00+00', 'Alps, France', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'mountain-trail-challenge-2025', NOW(), NOW()),

-- Marathon Society events (past events)
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'City Marathon 2023', 'Urban marathon through historic districts', '2023-09-10 07:00:00+00', '2023-09-10 15:00:00+00', 'Paris, France', NULL, 'city-marathon-2023', NOW(), NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'City Marathon 2024', 'Second edition of our city marathon', '2024-09-10 07:00:00+00', '2024-09-10 15:00:00+00', 'Paris, France', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'city-marathon-2024', NOW(), NOW()),

-- NEW 2025 Marathon Society event (OPEN FOR REGISTRATION)
('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'City Marathon 2025', 'Third edition of our city marathon', '2025-11-10 07:00:00+00', '2025-11-10 15:00:00+00', 'Paris, France', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'city-marathon-2025', NOW(), NOW()),

-- Ultra Challenge events (past events)
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'Desert Ultra 2023', '100km desert endurance challenge', '2023-11-05 06:00:00+00', '2023-11-06 18:00:00+00', 'Sahara, Morocco', NULL, 'desert-ultra-2023', NOW(), NOW()),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'Desert Ultra 2024', 'Second edition of the ultimate desert challenge', '2024-11-05 06:00:00+00', '2024-11-06 18:00:00+00', 'Sahara, Morocco', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'desert-ultra-2024', NOW(), NOW()),

-- NEW 2025 Ultra Challenge event (OPEN FOR REGISTRATION)
('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Desert Ultra 2025', 'Third edition of the ultimate desert challenge', '2025-12-05 06:00:00+00', '2025-12-06 18:00:00+00', 'Sahara, Morocco', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'desert-ultra-2025', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  location = EXCLUDED.location,
  slug = EXCLUDED.slug,
  updated_at = NOW();

-- Step 5: Create races for each event (handle duplicates)
INSERT INTO races (id, event_id, name, distance_km, elevation_m, start_time, price_cents, currency, max_participants, slug, created_at, updated_at) VALUES
-- Mountain Trail Challenge 2023 races (PAST - CLOSED)
('21111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '10K Trail', 10.0, 500, '2023-06-15 08:00:00+00', 2500, 'EUR', 150, '10k-trail', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '21K Trail', 21.0, 1200, '2023-06-15 08:30:00+00', 4500, 'EUR', 100, '21k-trail', NOW(), NOW()),
('23333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '42K Ultra Trail', 42.0, 2500, '2023-06-15 07:00:00+00', 7500, 'EUR', 50, '42k-ultra-trail', NOW(), NOW()),

-- Mountain Trail Challenge 2024 races (PAST - CLOSED)
('24444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '10K Trail', 10.0, 500, '2024-06-15 08:00:00+00', 2800, 'EUR', 180, '10k-trail', NOW(), NOW()),
('25555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '21K Trail', 21.0, 1200, '2024-06-15 08:30:00+00', 4800, 'EUR', 120, '21k-trail', NOW(), NOW()),
('26666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '42K Ultra Trail', 42.0, 2500, '2024-06-15 07:00:00+00', 8000, 'EUR', 60, '42k-ultra-trail', NOW(), NOW()),

-- NEW Mountain Trail Challenge 2025 races (FUTURE - OPEN FOR REGISTRATION)
('31111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '10K Trail', 10.0, 500, '2025-10-15 08:00:00+00', 3000, 'EUR', 200, '10k-trail', NOW(), NOW()),
('32222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', '21K Trail', 21.0, 1200, '2025-10-15 08:30:00+00', 5000, 'EUR', 150, '21k-trail', NOW(), NOW()),
('33333334-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', '42K Ultra Trail', 42.0, 2500, '2025-10-15 07:00:00+00', 8500, 'EUR', 80, '42k-ultra-trail', NOW(), NOW()),

-- City Marathon 2023 races (PAST - CLOSED)
('27777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '10K Fun Run', 10.0, 50, '2023-09-10 09:00:00+00', 2000, 'EUR', 500, '10k-fun-run', NOW(), NOW()),
('28888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '21K Half Marathon', 21.1, 100, '2023-09-10 08:00:00+00', 3500, 'EUR', 300, '21k-half-marathon', NOW(), NOW()),
('29999999-9999-9999-9999-999999999999', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '42K Marathon', 42.2, 150, '2023-09-10 07:00:00+00', 6000, 'EUR', 200, '42k-marathon', NOW(), NOW()),

-- City Marathon 2024 races (PAST - CLOSED)
('2a111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '10K Fun Run', 10.0, 50, '2024-09-10 09:00:00+00', 2200, 'EUR', 600, '10k-fun-run', NOW(), NOW()),
('2b222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '21K Half Marathon', 21.1, 100, '2024-09-10 08:00:00+00', 3800, 'EUR', 350, '21k-half-marathon', NOW(), NOW()),
('2c333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '42K Marathon', 42.2, 150, '2024-09-10 07:00:00+00', 6500, 'EUR', 250, '42k-marathon', NOW(), NOW()),

-- NEW City Marathon 2025 races (FUTURE - OPEN FOR REGISTRATION)
('34444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', '10K Fun Run', 10.0, 50, '2025-11-10 09:00:00+00', 2500, 'EUR', 700, '10k-fun-run', NOW(), NOW()),
('35555555-5555-5555-5555-555555555555', 'a2222222-2222-2222-2222-222222222222', '21K Half Marathon', 21.1, 100, '2025-11-10 08:00:00+00', 4000, 'EUR', 400, '21k-half-marathon', NOW(), NOW()),
('36666666-6666-6666-6666-666666666666', 'a2222222-2222-2222-2222-222222222222', '42K Marathon', 42.2, 150, '2025-11-10 07:00:00+00', 7000, 'EUR', 300, '42k-marathon', NOW(), NOW()),

-- Desert Ultra 2023 races (PAST - CLOSED)
('2d444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '50K Desert Challenge', 50.0, 800, '2023-11-05 06:00:00+00', 12000, 'EUR', 100, '50k-desert-challenge', NOW(), NOW()),
('2e555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '100K Desert Ultra', 100.0, 1500, '2023-11-05 06:00:00+00', 25000, 'EUR', 50, '100k-desert-ultra', NOW(), NOW()),

-- Desert Ultra 2024 races (PAST - CLOSED)
('2f666666-6666-6666-6666-666666666666', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '50K Desert Challenge', 50.0, 800, '2024-11-05 06:00:00+00', 13000, 'EUR', 120, '50k-desert-challenge', NOW(), NOW()),
('2a777777-7777-7777-7777-777777777777', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '100K Desert Ultra', 100.0, 1500, '2024-11-05 06:00:00+00', 27000, 'EUR', 60, '100k-desert-ultra', NOW(), NOW()),
('2b888888-8888-8888-8888-888888888888', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '150K Extreme Ultra', 150.0, 2200, '2024-11-05 05:00:00+00', 45000, 'EUR', 25, '150k-extreme-ultra', NOW(), NOW()),

-- NEW Desert Ultra 2025 races (FUTURE - OPEN FOR REGISTRATION)
('37777777-7777-7777-7777-777777777777', 'a3333333-3333-3333-3333-333333333333', '50K Desert Challenge', 50.0, 800, '2025-12-05 06:00:00+00', 15000, 'EUR', 150, '50k-desert-challenge', NOW(), NOW()),
('38888888-8888-8888-8888-888888888888', 'a3333333-3333-3333-3333-333333333333', '100K Desert Ultra', 100.0, 1500, '2025-12-05 06:00:00+00', 30000, 'EUR', 80, '100k-desert-ultra', NOW(), NOW()),
('39999999-9999-9999-9999-999999999999', 'a3333333-3333-3333-3333-333333333333', '150K Extreme Ultra', 150.0, 2200, '2025-12-05 05:00:00+00', 50000, 'EUR', 30, '150k-extreme-ultra', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  distance_km = EXCLUDED.distance_km,
  elevation_m = EXCLUDED.elevation_m,
  start_time = EXCLUDED.start_time,
  price_cents = EXCLUDED.price_cents,
  max_participants = EXCLUDED.max_participants,
  updated_at = NOW();

-- Step 6: Verify the data
SELECT 'Existing User Profile:' as info, count(*) as count FROM profiles WHERE id = 'f7bbe398-2d2e-4140-ae04-3afd24c11533';
SELECT 'Organizations Created:' as info, count(*) as count FROM organizations;
SELECT 'Total Events Created:' as info, count(*) as count FROM events;
SELECT 'Future Events (2025+):' as info, count(*) as count FROM events WHERE start_date >= '2025-01-01';
SELECT 'Total Races Created:' as info, count(*) as count FROM races;
SELECT 'Future Races (2025+):' as info, count(*) as count FROM races WHERE start_time >= '2025-01-01';

-- Show event relationships
SELECT 
  e1.name as event_name,
  e1.start_date::date as event_date,
  e2.name as previous_event_name,
  e2.start_date::date as previous_event_date,
  CASE 
    WHEN e1.start_date >= NOW() THEN 'FUTURE - OPEN'
    ELSE 'PAST - CLOSED'
  END as status
FROM events e1
LEFT JOIN events e2 ON e1.previous_event_id = e2.id
ORDER BY e1.organization_id, e1.start_date;
