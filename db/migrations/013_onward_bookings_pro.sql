-- Support Pro bookings without Stripe payment (dual pricing model)
-- Pro users: 2 free bookings/month, Non-Pro: $12 per ticket

ALTER TABLE onward_bookings ALTER COLUMN amount_charged SET DEFAULT 0;

-- Track booking type: 'paid' (Stripe $12) or 'pro' (included with subscription)
ALTER TABLE onward_bookings ADD COLUMN IF NOT EXISTS booking_type VARCHAR(20) DEFAULT 'paid';

-- Store Duffel offer ID for Pro booking idempotency
ALTER TABLE onward_bookings ADD COLUMN IF NOT EXISTS duffel_offer_id VARCHAR(255);

-- Prevent duplicate Pro bookings for the same offer by the same user
CREATE UNIQUE INDEX IF NOT EXISTS idx_onward_bookings_user_offer
  ON onward_bookings(user_id, duffel_offer_id) WHERE duffel_offer_id IS NOT NULL;

-- Index for monthly booking count queries (Pro limit enforcement)
CREATE INDEX IF NOT EXISTS idx_onward_bookings_user_month
  ON onward_bookings(user_id, created_at DESC);
