-- Seed creative patterns for GlowGuard Pet Hair Remover Roller
-- Product ID: 1a123976-f557-44e0-bced-840237afdab8

INSERT INTO creative_patterns (
  pattern_id,
  product_id,
  structure,
  emotion_tags,
  style_tags,
  hook_text,
  notes,
  observed_performance,
  created_at
)
VALUES
-- 1️⃣ Problem–Solution Structure: Daily frustration angle
(
  gen_random_uuid(),
  '1a123976-f557-44e0-bced-840237afdab8',
  'problem-solution',
  ARRAY['relief', 'satisfaction'],
  ARRAY['relatable', 'clean', 'domestic'],
  'Tired of pet hair clinging to everything?',
  'Opens on frustration with hair-covered furniture; demonstrates quick fix with GlowGuard roller and shows the clean result.',
  jsonb_build_object(
    'platform', 'TikTok',
    'performance', 'Above average watch retention for household tools category',
    'ctr', 0.065
  ),
  NOW()
),

-- 2️⃣ Product Demo Angle: Reusable sustainability focus
(
  gen_random_uuid(),
  '1a123976-f557-44e0-bced-840237afdab8',
  'product-demo',
  ARRAY['trust', 'eco-friendly'],
  ARRAY['calm', 'instructive', 'minimalist'],
  'No sticky refills. No waste.',
  'Focuses on sustainability and reusability—contrasts with disposable lint rollers.',
  jsonb_build_object(
    'platform', 'Instagram Reels',
    'performance', 'High completion rate among eco-conscious audiences',
    'ctr', 0.052
  ),
  NOW()
),

-- 3️⃣ Pet Owner POV: Emotional connection
(
  gen_random_uuid(),
  '1a123976-f557-44e0-bced-840237afdab8',
  'testimonial',
  ARRAY['love', 'gratitude'],
  ARRAY['warm', 'homey', 'uplifting'],
  '"I can finally cuddle on the couch again!"',
  'Owner testimonial tone — emotional relief after struggling with pet hair for years.',
  jsonb_build_object(
    'platform', 'Facebook Video',
    'performance', 'Strong engagement and comment sentiment',
    'ctr', 0.071
  ),
  NOW()
),

-- 4️⃣ Quick Hack: Visual transformation before/after
(
  gen_random_uuid(),
  '1a123976-f557-44e0-bced-840237afdab8',
  'before-after',
  ARRAY['satisfaction', 'surprise'],
  ARRAY['fast-paced', 'visual', 'energetic'],
  'One swipe and the couch is spotless!',
  'Emphasizes visual transformation in under 5 seconds; good for short-form.',
  jsonb_build_object(
    'platform', 'TikTok',
    'performance', 'Very high completion rate under 15 seconds',
    'ctr', 0.084
  ),
  NOW()
),

-- 5️⃣ Educational: Explain the self-cleaning mechanism
(
  gen_random_uuid(),
  '1a123976-f557-44e0-bced-840237afdab8',
  'how-it-works',
  ARRAY['curiosity', 'trust'],
  ARRAY['educational', 'satisfying', 'slow-motion'],
  'Ever wondered how a “self-cleaning” roller actually works?',
  'Demonstrates the internal chamber system and its reusability; uses close-ups and ASMR-style sound design.',
  jsonb_build_object(
    'platform', 'YouTube Shorts',
    'performance', 'Moderate, but strong saves and shares',
    'ctr', 0.047
  ),
  NOW()
);
