-- OPTIMIZED DATABASE STRUCTURE - No Redundancy
-- Migration: 20250817_optimized_extras_system

-- 1. DROP: existing redundant tables
DROP TABLE IF EXISTS ticket_extras CASCADE;
DROP TABLE IF EXISTS participant_extras CASCADE;
DROP TABLE IF EXISTS race_extras CASCADE;
DROP TABLE IF EXISTS extras CASCADE;

-- 2. CREATE: race_extras table (catalogue des extras)
CREATE TABLE IF NOT EXISTS race_extras (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    race_id UUID REFERENCES races(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'EUR' NOT NULL,
    max_quantity_per_participant INTEGER DEFAULT 1,
    total_available_quantity INTEGER,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(race_id, name)
);

-- 3. CREATE: participant_extras table (SEULE SOURCE DE VÉRITÉ)
CREATE TABLE IF NOT EXISTS participant_extras (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
    race_extra_id UUID REFERENCES race_extras(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_cents INTEGER NOT NULL, -- Prix au moment de l'achat
    total_price_cents INTEGER NOT NULL, -- quantity * unit_price_cents
    currency TEXT DEFAULT 'EUR' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant_id, race_extra_id)
);

-- 4. UPDATE: participants table structure
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS medical_notes TEXT,
ADD COLUMN IF NOT EXISTS bid_number TEXT;

-- Ensure first_name and last_name have default values for existing records
UPDATE participants SET first_name = 'Unknown' WHERE first_name IS NULL OR first_name = '';
UPDATE participants SET last_name = 'Participant' WHERE last_name IS NULL OR last_name = '';

-- Set NOT NULL constraints
ALTER TABLE participants ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE participants ALTER COLUMN last_name SET NOT NULL;

-- 5. ENABLE: Row Level Security
ALTER TABLE race_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_extras ENABLE ROW LEVEL SECURITY;

-- 6. CREATE: RLS policies for race_extras
CREATE POLICY "Race extras are viewable by everyone" ON race_extras FOR SELECT USING (true);

CREATE POLICY "Organization founders can manage race extras" ON race_extras FOR ALL USING (
    EXISTS (
        SELECT 1 FROM races r
        JOIN events e ON e.id = r.event_id
        JOIN organizations o ON o.id = e.organization_id
        WHERE r.id = race_id AND o.founder_id = auth.uid()
    )
);

-- 7. CREATE: RLS policies for participant_extras
CREATE POLICY "Users can view participant extras for their tickets" ON participant_extras FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM participants p
        JOIN tickets t ON t.id = p.ticket_id
        WHERE p.id = participant_id AND t.buyer_id = auth.uid()
    )
);

CREATE POLICY "Users can manage participant extras for their tickets" ON participant_extras FOR ALL USING (
    EXISTS (
        SELECT 1 FROM participants p
        JOIN tickets t ON t.id = p.ticket_id
        WHERE p.id = participant_id AND t.buyer_id = auth.uid()
    )
);

CREATE POLICY "Organization founders can view participant extras for their events" ON participant_extras FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM participants p
        JOIN tickets t ON t.id = p.ticket_id
        JOIN races r ON r.id = t.race_id
        JOIN events e ON e.id = r.event_id
        JOIN organizations o ON o.id = e.organization_id
        WHERE p.id = participant_id AND o.founder_id = auth.uid()
    )
);

-- 8. CREATE: Indexes for performance
CREATE INDEX IF NOT EXISTS idx_race_extras_race_id ON race_extras(race_id);
CREATE INDEX IF NOT EXISTS idx_race_extras_active ON race_extras(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_participant_extras_participant_id ON participant_extras(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_extras_race_extra_id ON participant_extras(race_extra_id);

-- 9. CREATE: View for race extras with availability (calculé depuis participant_extras)
CREATE OR REPLACE VIEW race_extras_with_availability AS
SELECT 
    re.*,
    COALESCE(
        re.total_available_quantity - COALESCE(SUM(pe.quantity), 0),
        re.total_available_quantity
    ) as remaining_quantity
FROM race_extras re
LEFT JOIN participant_extras pe ON pe.race_extra_id = re.id
WHERE re.is_active = true
GROUP BY re.id, re.race_id, re.name, re.description, re.price_cents, re.currency, 
         re.max_quantity_per_participant, re.total_available_quantity, re.display_order, 
         re.is_active, re.created_at, re.updated_at
ORDER BY re.display_order, re.name;

-- 10. CREATE: View for ticket totals (calculé depuis participant_extras)
CREATE OR REPLACE VIEW ticket_totals AS
SELECT 
    t.id as ticket_id,
    t.race_id,
    r.price_cents as race_price_cents,
    r.currency,
    COUNT(p.id) as participants_count,
    (r.price_cents * COUNT(p.id)) as race_total_cents,
    COALESCE(SUM(pe.total_price_cents), 0) as extras_total_cents,
    (r.price_cents * COUNT(p.id)) + COALESCE(SUM(pe.total_price_cents), 0) as subtotal_cents
FROM tickets t
JOIN races r ON r.id = t.race_id
JOIN participants p ON p.ticket_id = t.id
LEFT JOIN participant_extras pe ON pe.participant_id = p.id
GROUP BY t.id, t.race_id, r.price_cents, r.currency;

-- 11. INSERT: Sample extras for existing races
INSERT INTO race_extras (race_id, name, description, price_cents, currency, max_quantity_per_participant, total_available_quantity, display_order) 
SELECT 
    r.id as race_id,
    unnest(ARRAY['T-Shirt', 'Medal', 'Certificate', 'Goody Bag', 'Breakfast', 'Lunch', 'Pasta Party']) as name,
    unnest(ARRAY[
        'Official race t-shirt (cotton blend)',
        'Finisher medal with custom ribbon',
        'Digital certificate of completion',
        'Race goody bag with sponsor items',
        'Pre-race breakfast buffet',
        'Post-race lunch buffet',
        'Pre-race pasta party dinner'
    ]) as description,
    unnest(ARRAY[2500, 1500, 500, 3000, 1200, 1800, 2200]) as price_cents,
    r.currency,
    unnest(ARRAY[2, 1, 1, 1, 1, 1, 1]) as max_quantity_per_participant,
    unnest(ARRAY[200, 100, 500, 150, 80, 80, 60]) as total_available_quantity,
    unnest(ARRAY[1, 2, 3, 4, 5, 6, 7]) as display_order
FROM races r
WHERE EXISTS (SELECT 1 FROM races WHERE id = r.id)
ON CONFLICT (race_id, name) DO NOTHING;

-- 12. CREATE: Helper functions
CREATE OR REPLACE FUNCTION get_participant_extras_total(participant_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(total_price_cents) FROM participant_extras WHERE participant_id = participant_uuid),
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_ticket_extras_total(ticket_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(pe.total_price_cents) 
         FROM participant_extras pe
         JOIN participants p ON p.id = pe.participant_id
         WHERE p.ticket_id = ticket_uuid),
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. CREATE: Trigger pour maintenir la cohérence des prix
CREATE OR REPLACE FUNCTION update_participant_extra_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_price_cents := NEW.quantity * NEW.unit_price_cents;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER participant_extras_update_total
    BEFORE INSERT OR UPDATE ON participant_extras
    FOR EACH ROW
    EXECUTE FUNCTION update_participant_extra_total();

-- 14. VERIFICATION: Check structure
SELECT 'Optimized structure created:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('race_extras', 'participant_extras');

SELECT 'Sample data inserted:' as status;
SELECT COUNT(*) as extras_count FROM race_extras;
