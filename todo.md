# TODO: Fix 502 Error on /api/attractions

## Problem
The `/api/attractions` endpoint returns 502 (Bad Gateway) because `DATABASE_URL` is not configured.

## Steps to Fix

### Step 1: Get Neon Database URL
1. Go to https://neon.tech and sign up/login
2. Create a new project (if needed)
3. Copy the connection string from the dashboard
   - Format: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

### Step 2: Add Environment Variable to Netlify
1. Go to **Netlify Dashboard** → **Your Site** → **Site configuration** → **Environment variables**
2. Add new variable:
   - **Key:** `DATABASE_URL`
   - **Value:** Your Neon connection string

### Step 3: Create Database Tables
Run this SQL in Neon SQL Editor (https://console.neon.tech):

```sql
CREATE TABLE IF NOT EXISTS attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  about TEXT,
  category VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  province VARCHAR(100),
  image_url TEXT,
  is_hidden_gem BOOLEAN DEFAULT false,
  is_pro_only BOOLEAN DEFAULT false,
  categories JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attraction_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attraction_id UUID REFERENCES attractions(id) ON DELETE CASCADE,
  tip_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_pro_only BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attraction_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attraction_id UUID REFERENCES attractions(id) ON DELETE CASCADE,
  secret_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  location_hint TEXT,
  is_pro_only BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attraction_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attraction_id UUID REFERENCES attractions(id) ON DELETE CASCADE,
  rec_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  why_special TEXT,
  price_range VARCHAR(50),
  google_maps_url TEXT,
  is_pro_only BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) UNIQUE NOT NULL,
  prefs JSONB DEFAULT '{}',
  is_pro BOOLEAN DEFAULT false,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 4: Redeploy
After adding the env var, trigger a redeploy in Netlify (or push any commit).

## Verification Checklist
- [ ] DATABASE_URL added to Netlify env vars
- [ ] SQL tables created in Neon
- [ ] Site redeployed
- [ ] `/attractions` page loads without 502 error (empty list is OK)

---

## Other Environment Variables Needed

Check `.env.example` for the full list:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `ANTHROPIC_API_KEY` - For AI features
- `CLERK_*` - For authentication (if using Clerk)
- `STRIPE_*` - For payments (if using Stripe)
