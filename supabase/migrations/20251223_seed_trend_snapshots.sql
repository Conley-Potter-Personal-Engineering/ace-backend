-- Seed trend snapshots for GlowGuard Pet Hair Remover Roller
-- Product ID: 1a123976-f557-44e0-bced-840237afdab8

INSERT INTO trend_snapshots (
  snapshot_id,
  product_id,
  tiktok_trend_tags,
  velocity_score,
  popularity_score
)
VALUES
-- 1️⃣ “Satisfying cleaning” trend — fast-motion couch transformations
(
  gen_random_uuid(),
  '1a123976-f557-44e0-bced-840237afdab8',
  ARRAY['cleantok', 'satisfying', 'beforeafter', 'petownerhack'],
  0.88,
  0.91
),

-- 2️⃣ “Pet care essentials” trend — showing daily routines with pets
(
  gen_random_uuid(),
  '1a123976-f557-44e0-bced-840237afdab8',
  ARRAY['petcare', 'dailyhabits', 'petparent', 'cozyhome'],
  0.74,
  0.86
),

-- 3️⃣ “Reusable swap” sustainability trend
(
  gen_random_uuid(),
  '1a123976-f557-44e0-bced-840237afdab8',
  ARRAY['reusableswap', 'ecohome', 'sustainableliving'],
  0.67,
  0.79
),

-- 4️⃣ “ASMR cleaning sounds” trend
(
  gen_random_uuid(),
  '1a123976-f557-44e0-bced-840237afdab8',
  ARRAY['asmrcleaning', 'cleantok', 'satisfyingsounds'],
  0.81,
  0.83
),

-- 5️⃣ “Tiny home hacks” trend — maximizing cleanliness and space
(
  gen_random_uuid(),
  '1a123976-f557-44e0-bced-840237afdab8',
  ARRAY['tinyhome', 'cleaninghack', 'minimalism'],
  0.73,
  0.77
);
