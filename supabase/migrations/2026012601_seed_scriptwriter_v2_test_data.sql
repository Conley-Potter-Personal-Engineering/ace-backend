-- ============================================================
-- Scriptwriter V2 Test Data Seed
-- ============================================================

-- Step 1: Clear invalid data
DELETE FROM public.products
WHERE product_id IS NULL
  OR name IS NULL
  OR source_platform IS NULL
  OR created_at IS NULL
  OR updated_at IS NULL;

DELETE FROM public.creative_patterns
WHERE pattern_id IS NULL
  OR product_id IS NULL
  OR created_at IS NULL;

DELETE FROM public.trend_snapshots
WHERE snapshot_id IS NULL
  OR product_id IS NULL
  OR popularity_score IS NULL
  OR velocity_score IS NULL
  OR snapshot_time IS NULL;

-- Step 2: Seed products with complete meta fields
INSERT INTO public.products (
  product_id,
  name,
  description,
  category,
  source_platform,
  affiliate_link,
  image_url,
  created_at,
  updated_at,
  status,
  currency,
  key_features,
  demo_ideas,
  objections,
  meta
) VALUES (
  'b3a64c2a-3f4a-4c2a-9b7a-1b2f7c4f1a01',
  'PulseBand Sleep Tracker',
  'A lightweight sleep tracker ring that monitors sleep stages and recovery signals.',
  'Wellness',
  'integration',
  'https://example.com/aff/pulseband-sleep-tracker',
  'https://images.example.com/pulseband-sleep-tracker.jpg',
  '2026-01-26T08:00:00.000Z',
  '2026-01-26T08:00:00.000Z',
  'active',
  'USD',
  jsonb_build_array(
    'Sleep stage tracking',
    'All-day comfort band',
    'Battery lasts 7 nights'
  ),
  jsonb_build_array(
    'Morning routine reveal',
    'Sleep score walkthrough',
    'Weeknight vs weekend comparison'
  ),
  jsonb_build_array(
    'Concerned about accuracy',
    'Worried about comfort',
    'Unsure about battery life'
  ),
  jsonb_build_object(
    'key_features', jsonb_build_array(
      'Sleep stage tracking',
      'All-day comfort band',
      'Battery lasts 7 nights'
    ),
    'demo_ideas', jsonb_build_array(
      'Morning routine reveal',
      'Sleep score walkthrough',
      'Weeknight vs weekend comparison'
    ),
    'objections', jsonb_build_array(
      'Concerned about accuracy',
      'Worried about comfort',
      'Unsure about battery life'
    ),
    'compliance', jsonb_build_array(
      'No medical diagnosis claims',
      'Avoid guaranteed sleep improvement promises'
    )
  )
) ON CONFLICT (product_id) DO NOTHING;

INSERT INTO public.products (
  product_id,
  name,
  description,
  category,
  source_platform,
  affiliate_link,
  image_url,
  created_at,
  updated_at,
  status,
  currency,
  key_features,
  demo_ideas,
  objections,
  meta
) VALUES (
  'b3a64c2a-3f4a-4c2a-9b7a-1b2f7c4f1a02',
  'GlowBrew Collagen Coffee',
  'A collagen-infused coffee blend designed for a smooth morning ritual.',
  'Nutrition',
  'integration',
  'https://example.com/aff/glowbrew-collagen-coffee',
  'https://images.example.com/glowbrew-collagen-coffee.jpg',
  '2026-01-26T08:05:00.000Z',
  '2026-01-26T08:05:00.000Z',
  'active',
  'USD',
  jsonb_build_array(
    '10g collagen per serving',
    'Low-acid blend',
    'Natural vanilla notes'
  ),
  jsonb_build_array(
    'Morning pour-over routine',
    'Foamy latte before/after',
    'Desk-side taste test'
  ),
  jsonb_build_array(
    'Worried about taste',
    'Unsure about mixability'
  ),
  jsonb_build_object(
    'key_features', jsonb_build_array(
      '10g collagen per serving',
      'Low-acid blend',
      'Natural vanilla notes'
    ),
    'demo_ideas', jsonb_build_array(
      'Morning pour-over routine',
      'Foamy latte before/after',
      'Desk-side taste test'
    ),
    'objections', jsonb_build_array(
      'Worried about taste',
      'Unsure about mixability'
    ),
    'compliance', jsonb_build_array(
      'No medical claims about skin or joints',
      'Avoid guaranteed results'
    )
  )
) ON CONFLICT (product_id) DO NOTHING;

INSERT INTO public.products (
  product_id,
  name,
  description,
  category,
  source_platform,
  affiliate_link,
  image_url,
  created_at,
  updated_at,
  status,
  currency,
  key_features,
  demo_ideas,
  objections,
  meta
) VALUES (
  'b3a64c2a-3f4a-4c2a-9b7a-1b2f7c4f1a03',
  'FlexiLamp Desk Light',
  'A compact LED desk lamp with adjustable color temperature and USB charging.',
  'Home Office',
  'integration',
  'https://example.com/aff/flexilamp-desk-light',
  'https://images.example.com/flexilamp-desk-light.jpg',
  '2026-01-26T08:10:00.000Z',
  '2026-01-26T08:10:00.000Z',
  'active',
  'USD',
  jsonb_build_array(
    'Adjustable color temperature',
    'Fold-flat design',
    'USB-C charging port'
  ),
  jsonb_build_array(
    'Desk makeover before/after',
    'Night shift lighting demo',
    'Fold-and-pack travel shot'
  ),
  jsonb_build_array(
    'Concerned about brightness',
    'Unsure about durability'
  ),
  jsonb_build_object(
    'key_features', jsonb_build_array(
      'Adjustable color temperature',
      'Fold-flat design',
      'USB-C charging port'
    ),
    'demo_ideas', jsonb_build_array(
      'Desk makeover before/after',
      'Night shift lighting demo',
      'Fold-and-pack travel shot'
    ),
    'objections', jsonb_build_array(
      'Concerned about brightness',
      'Unsure about durability'
    ),
    'compliance', jsonb_build_array(
      'No guaranteed productivity claims',
      'Avoid medical or vision-related claims'
    )
  )
) ON CONFLICT (product_id) DO NOTHING;

-- Step 3: Seed creative patterns (2 per product)
INSERT INTO public.creative_patterns (
  pattern_id,
  product_id,
  hook_text,
  structure,
  style_tags,
  emotion_tags,
  observed_performance,
  notes,
  created_at
) VALUES
(
  'f2b6a4c1-1a2b-4c3d-8e9f-111111111111',
  'b3a64c2a-3f4a-4c2a-9b7a-1b2f7c4f1a01',
  'Ever wake up tired after a full night? Here is what surprised me.',
  'problem-solution',
  ARRAY['direct','explainer'],
  ARRAY['curious','hopeful'],
  jsonb_build_object('views', 125000, 'engagement_rate', 0.082, 'conversion_rate', 0.034),
  'Lead with morning routine shot, then show the sleep score screen.',
  '2026-01-26T09:00:00.000Z'
),
(
  'f2b6a4c1-1a2b-4c3d-8e9f-222222222222',
  'b3a64c2a-3f4a-4c2a-9b7a-1b2f7c4f1a01',
  'I tracked my sleep for 7 nights and here is the difference.',
  'story-arc',
  ARRAY['testimonial','calm'],
  ARRAY['inspiring','relieved'],
  jsonb_build_object('views', 98000, 'engagement_rate', 0.071, 'conversion_rate', 0.028),
  'Use a quick montage of nightly check-ins.',
  '2026-01-26T09:05:00.000Z'
),
(
  'f2b6a4c1-1a2b-4c3d-8e9f-333333333333',
  'b3a64c2a-3f4a-4c2a-9b7a-1b2f7c4f1a02',
  'This coffee switch made my morning feel different.',
  'reveal',
  ARRAY['direct','taste-test'],
  ARRAY['curious','uplifted'],
  jsonb_build_object('views', 142000, 'engagement_rate', 0.089, 'conversion_rate', 0.041),
  'Focus on aroma and texture shots.',
  '2026-01-26T09:10:00.000Z'
),
(
  'f2b6a4c1-1a2b-4c3d-8e9f-444444444444',
  'b3a64c2a-3f4a-4c2a-9b7a-1b2f7c4f1a02',
  'Collagen coffee? I tried it for a week so you do not have to.',
  'comparison',
  ARRAY['testimonial','direct'],
  ARRAY['skeptical','curious'],
  jsonb_build_object('views', 86000, 'engagement_rate', 0.064, 'conversion_rate', 0.022),
  'Show side-by-side prep with regular coffee.',
  '2026-01-26T09:15:00.000Z'
),
(
  'f2b6a4c1-1a2b-4c3d-8e9f-555555555555',
  'b3a64c2a-3f4a-4c2a-9b7a-1b2f7c4f1a03',
  'My desk felt dark until I did this simple upgrade.',
  'problem-solution',
  ARRAY['direct','demo'],
  ARRAY['relieved','inspired'],
  jsonb_build_object('views', 74000, 'engagement_rate', 0.058, 'conversion_rate', 0.019),
  'Show workspace before/after lighting swap.',
  '2026-01-26T09:20:00.000Z'
),
(
  'f2b6a4c1-1a2b-4c3d-8e9f-666666666666',
  'b3a64c2a-3f4a-4c2a-9b7a-1b2f7c4f1a03',
  'Three lighting modes and one tiny lamp.',
  'reveal',
  ARRAY['quick-cut','demo'],
  ARRAY['curious','satisfied'],
  jsonb_build_object('views', 91000, 'engagement_rate', 0.073, 'conversion_rate', 0.027),
  'Use fast cuts for each lighting mode.',
  '2026-01-26T09:25:00.000Z'
)
ON CONFLICT (pattern_id) DO NOTHING;

-- Step 4: Seed trend snapshots (2 per product)
INSERT INTO public.trend_snapshots (
  snapshot_id,
  product_id,
  popularity_score,
  velocity_score,
  competition_score,
  tiktok_trend_tags,
  raw_source_data,
  snapshot_time
) VALUES
(
  'a7c5b2d1-1111-4c3d-8e9f-111111111111',
  'b3a64c2a-3f4a-4c2a-9b7a-1b2f7c4f1a01',
  78,
  0.65,
  42,
  ARRAY['sleepwell', 'recoveryroutine'],
  jsonb_build_object('source', 'tiktok_api', 'hashtag_views', 2400000),
  '2026-01-26T12:00:00.000Z'
),
(
  'a7c5b2d1-2222-4c3d-8e9f-222222222222',
  'b3a64c2a-3f4a-4c2a-9b7a-1b2f7c4f1a01',
  72,
  0.52,
  47,
  ARRAY['morningroutine', 'restday'],
  jsonb_build_object('source', 'tiktok_api', 'hashtag_views', 1800000),
  '2026-01-27T12:00:00.000Z'
),
(
  'a7c5b2d1-3333-4c3d-8e9f-333333333333',
  'b3a64c2a-3f4a-4c2a-9b7a-1b2f7c4f1a02',
  81,
  0.7,
  38,
  ARRAY['coffeetok', 'morningfuel'],
  jsonb_build_object('source', 'tiktok_api', 'hashtag_views', 3100000),
  '2026-01-26T12:10:00.000Z'
),
(
  'a7c5b2d1-4444-4c3d-8e9f-444444444444',
  'b3a64c2a-3f4a-4c2a-9b7a-1b2f7c4f1a02',
  69,
  0.48,
  44,
  ARRAY['latteart', 'selfcarecoffee'],
  jsonb_build_object('source', 'tiktok_api', 'hashtag_views', 1500000),
  '2026-01-27T12:10:00.000Z'
),
(
  'a7c5b2d1-5555-4c3d-8e9f-555555555555',
  'b3a64c2a-3f4a-4c2a-9b7a-1b2f7c4f1a03',
  66,
  0.41,
  52,
  ARRAY['desksetup', 'workspaceglow'],
  jsonb_build_object('source', 'tiktok_api', 'hashtag_views', 1200000),
  '2026-01-26T12:20:00.000Z'
),
(
  'a7c5b2d1-6666-4c3d-8e9f-666666666666',
  'b3a64c2a-3f4a-4c2a-9b7a-1b2f7c4f1a03',
  74,
  0.6,
  39,
  ARRAY['homeoffice', 'lightinghack'],
  jsonb_build_object('source', 'tiktok_api', 'hashtag_views', 2050000),
  '2026-01-27T12:20:00.000Z'
)
ON CONFLICT (snapshot_id) DO NOTHING;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
