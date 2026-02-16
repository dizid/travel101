CREATE TABLE IF NOT EXISTS onward_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  duffel_order_id VARCHAR(255) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  pnr VARCHAR(50) NOT NULL,
  airline VARCHAR(100),
  origin VARCHAR(10) NOT NULL,
  destination VARCHAR(10) NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  hold_expires_at TIMESTAMPTZ NOT NULL,
  passenger_name VARCHAR(255) NOT NULL,
  passenger_email VARCHAR(255),
  amount_charged INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_onward_bookings_user ON onward_bookings(user_id);
