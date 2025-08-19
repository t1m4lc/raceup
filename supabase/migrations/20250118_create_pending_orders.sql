-- Create pending_orders table for storing order data before payment completion
CREATE TABLE pending_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Order data (JSON for flexibility)
  cart_items JSONB NOT NULL,
  contact_info JSONB NOT NULL,
  commission_config JSONB,
  
  -- Payment reference
  stripe_payment_intent_id TEXT UNIQUE,
  
  -- Metadata
  total_amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Timestamps with auto-expiration
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 hours'),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'expired', 'cancelled'))
);

-- Index for efficient queries
CREATE INDEX idx_pending_orders_payment_intent ON pending_orders(stripe_payment_intent_id);
CREATE INDEX idx_pending_orders_user_id ON pending_orders(user_id);
CREATE INDEX idx_pending_orders_expires_at ON pending_orders(expires_at);
CREATE INDEX idx_pending_orders_status ON pending_orders(status);

-- RLS Policies
ALTER TABLE pending_orders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own pending orders
CREATE POLICY "Users can view own pending orders" ON pending_orders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own pending orders
CREATE POLICY "Users can create own pending orders" ON pending_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only service role can update pending orders (for webhook processing)
CREATE POLICY "Service role can update pending orders" ON pending_orders
  FOR UPDATE USING (auth.role() = 'service_role');

-- Auto-cleanup function for expired orders
CREATE OR REPLACE FUNCTION cleanup_expired_pending_orders()
RETURNS void AS $$
BEGIN
  UPDATE pending_orders 
  SET status = 'expired' 
  WHERE expires_at < NOW() 
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup every 7 days
SELECT cron.schedule('cleanup-expired-orders', '0 0 */7 * *', 'SELECT cleanup_expired_pending_orders();');

-- Note: Automatic cleanup can be implemented via:
-- 1. Application-level cron job (recommended)
-- 2. Database triggers on SELECT
-- 3. Manual cleanup calls
-- Function can be called manually: SELECT cleanup_expired_pending_orders();
