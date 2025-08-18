-- Create payment_cache table for temporary storage of cart data
CREATE TABLE IF NOT EXISTS payment_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_intent_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cart_data JSONB NOT NULL,
  contact_info JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  processed BOOLEAN DEFAULT FALSE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_cache_payment_intent ON payment_cache(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_cache_expires ON payment_cache(expires_at);

-- Enable RLS
ALTER TABLE payment_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can insert their own cache data" ON payment_cache 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own cache data" ON payment_cache 
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can access all (for webhooks)
CREATE POLICY "Service role can access all cache data" ON payment_cache 
  FOR ALL USING (auth.role() = 'service_role');

-- Auto-cleanup old cache entries (runs daily)
CREATE OR REPLACE FUNCTION cleanup_expired_cache() 
RETURNS void AS $$
BEGIN
  DELETE FROM payment_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON payment_cache TO authenticated;
GRANT ALL ON payment_cache TO service_role;
