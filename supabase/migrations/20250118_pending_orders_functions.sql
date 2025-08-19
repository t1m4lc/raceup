-- Helper functions for pending orders

-- Function to get pending order data
CREATE OR REPLACE FUNCTION get_pending_order(order_id UUID, payment_intent_id TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  cart_items JSONB,
  contact_info JSONB,
  commission_config JSONB,
  stripe_payment_intent_id TEXT,
  total_amount_cents INTEGER,
  currency TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    po.id,
    po.user_id,
    po.cart_items,
    po.contact_info,
    po.commission_config,
    po.stripe_payment_intent_id,
    po.total_amount_cents,
    po.currency,
    po.status,
    po.created_at,
    po.expires_at
  FROM pending_orders po
  WHERE po.id = order_id 
    AND po.stripe_payment_intent_id = payment_intent_id
    AND po.status = 'processing';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete pending order
CREATE OR REPLACE FUNCTION complete_pending_order(order_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE pending_orders 
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE id = order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
