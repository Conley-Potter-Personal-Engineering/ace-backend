BEGIN;

-- Seed trend_snapshots with realistic test data
INSERT INTO trend_snapshots (
  snapshot_id,
  product_id,
  popularity_score,
  velocity_score,
  competition_score,
  tiktok_trend_tags,
  raw_source_data,
  snapshot_time
)
SELECT
  gen_random_uuid(),
  (SELECT product_id FROM products ORDER BY random() LIMIT 1),
  (50 + floor(random() * 46))::int,
  (40 + floor(random() * 51))::int,
  (10 + floor(random() * 61))::int,
  tags,
  jsonb_build_object(
    'platform', 'tiktok',
    'views_24h', (10000 + floor(random() * 90000))::int,
    'likes_24h', (500 + floor(random() * 6000))::int,
    'shares_24h', (50 + floor(random() * 800))::int,
    'comment_rate', round((0.5 + random() * 3.5)::numeric, 2)
  ),
  now() - interval '1 day' * random() * 10
FROM (
  VALUES
    ('{ai,productivity,tools}'::text[]),
    ('{saas,founder,workflow}'::text[]),
    ('{notion,templates,automation}'::text[]),
    ('{marketing,content,shorts}'::text[]),
    ('{design,branding,creator}'::text[]),
    ('{finance,side_hustle,passive_income}'::text[]),
    ('{health,habits,routine}'::text[]),
    ('{education,study,hacks}'::text[])
) AS v(tags);

-- Seed creative_patterns with realistic test data
INSERT INTO creative_patterns (
  pattern_id,
  product_id,
  hook_text,
  structure,
  style_tags,
  emotion_tags,
  notes,
  observed_performance,
  created_at
)
SELECT
  gen_random_uuid(),
  (SELECT product_id FROM products ORDER BY random() LIMIT 1),
  hook_text,
  structure,
  style_tags,
  emotion_tags,
  notes,
  jsonb_build_object(
    'avg_watch_time_sec', (8 + floor(random() * 22))::int,
    'engagement_rate', round((1.2 + random() * 6.0)::numeric, 2),
    'save_rate', round((0.3 + random() * 2.0)::numeric, 2),
    'share_rate', round((0.2 + random() * 1.6)::numeric, 2)
  ),
  now()
FROM (
  VALUES
    ('This 30-second workflow doubled my output', 'hook, proof, steps, CTA', '{educational, concise}'::text[], '{motivating, confident}'::text[], 'Quick win format with tangible metric'),
    ('Stop doing this in your SaaS landing page', 'hook, conflict, reveal, CTA', '{direct, opinionated}'::text[], '{surprising, urgent}'::text[], 'Contrarian opener with clear fix'),
    ('I asked 5 founders how they plan content', 'hook, montage, insight, CTA', '{documentary, fast}'::text[], '{curious, relatable}'::text[], 'Social proof via mini-interviews'),
    ('The 3-line template that makes ideas stick', 'hook, teach, example, CTA', '{educational, playful}'::text[], '{inspiring, warm}'::text[], 'Short lesson with template reveal'),
    ('We tested 7 hooks so you do not have to', 'hook, experiment, result, CTA', '{data-driven, punchy}'::text[], '{trustworthy, confident}'::text[], 'A/B testing angle builds credibility'),
    ('A tiny change that tripled saves overnight', 'hook, conflict, reveal, CTA', '{story, minimal}'::text[], '{hopeful, relatable}'::text[], 'Small tweak with big payoff'),
    ('Your audience is scrolling for this', 'hook, context, benefit, CTA', '{bold, trendy}'::text[], '{excited, optimistic}'::text[], 'Trend awareness with payoff'),
    ('Make a week of content in 20 minutes', 'hook, walkthrough, proof, CTA', '{tutorial, efficient}'::text[], '{motivated, focused}'::text[], 'Speed-focused tutorial sequence')
) AS v(hook_text, structure, style_tags, emotion_tags, notes);

-- Link products to snapshots and patterns in product_creative_contexts
INSERT INTO product_creative_contexts (
  product_id,
  snapshot_id,
  pattern_id
)
SELECT
  p.product_id,
  COALESCE(
    (SELECT ts.snapshot_id FROM trend_snapshots ts WHERE ts.product_id = p.product_id ORDER BY random() LIMIT 1),
    (SELECT ts.snapshot_id FROM trend_snapshots ts ORDER BY random() LIMIT 1)
  ),
  COALESCE(
    (SELECT cp.pattern_id FROM creative_patterns cp WHERE cp.product_id = p.product_id ORDER BY random() LIMIT 1),
    (SELECT cp.pattern_id FROM creative_patterns cp ORDER BY random() LIMIT 1)
  )
FROM products p
CROSS JOIN LATERAL generate_series(1, (1 + floor(random() * 2))::int);

COMMIT;
