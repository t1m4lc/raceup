-- Add register_state to races table
ALTER TABLE races ADD COLUMN register_state TEXT NOT NULL DEFAULT 'open' CHECK (register_state IN ('not_open', 'open', 'closed'));

-- Update seed data to show different states
UPDATE races SET register_state = 'open' WHERE id = '00000000-0000-0000-0000-000000000020';
UPDATE races SET register_state = 'not_open' WHERE id = '00000000-0000-0000-0000-000000000021';

-- Optionally add a closed race example
-- UPDATE races SET register_state = 'closed' WHERE id = 'SOME_OTHER_ID';
