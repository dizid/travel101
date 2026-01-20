-- Migration: Add cost_tier column for explicit pricing categorization
-- Values: free, budget, mid_range, luxury

ALTER TABLE attractions ADD COLUMN IF NOT EXISTS cost_tier VARCHAR(20)
  CHECK (cost_tier IN ('free', 'budget', 'mid_range', 'luxury'));

-- Add index for filtering by cost
CREATE INDEX IF NOT EXISTS idx_attractions_cost_tier ON attractions(cost_tier);

-- Comment explaining the tiers
COMMENT ON COLUMN attractions.cost_tier IS
  'Explicit cost tier: free (temples, parks), budget (<500 THB), mid_range (500-2000 THB), luxury (>2000 THB)';
