-- Migration to cleanup redundant fields in the database schema

-- Keep both bib_number and bid_number in participants table - they serve different purposes:
-- bib_number: physical race bib number assigned to participant  
-- bid_number: participant ID that volunteers can enter during check-in

-- Consolidate phone fields in profiles table (keep phone_number, drop phone)
-- First copy data from phone to phone_number where phone_number is null
UPDATE profiles 
SET phone_number = phone 
WHERE phone_number IS NULL AND phone IS NOT NULL;

-- Then drop the redundant phone column
ALTER TABLE profiles DROP COLUMN IF EXISTS phone;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_participants_ticket_id ON participants(ticket_id);
CREATE INDEX IF NOT EXISTS idx_individual_tickets_participant_id ON individual_tickets(participant_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_tickets_stripe_payment_intent_id ON tickets(stripe_payment_intent_id);
