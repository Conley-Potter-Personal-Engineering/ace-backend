ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS price_usd numeric,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS primary_benefit text,
  ADD COLUMN IF NOT EXISTS target_audience text,
  ADD COLUMN IF NOT EXISTS content_brief text,
  ADD COLUMN IF NOT EXISTS key_features jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS objections jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS demo_ideas jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS products_status_idx ON public.products (status);
CREATE INDEX IF NOT EXISTS products_source_platform_idx ON public.products (source_platform);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category);
CREATE INDEX IF NOT EXISTS products_price_usd_idx ON public.products (price_usd);
INSERT INTO public.products (
  name,
  source_platform,
  category,
  price_usd,
  affiliate_link,
  image_url,
  brand,
  currency,
  status,
  primary_benefit,
  target_audience,
  content_brief,
  key_features,
  objections,
  demo_ideas,
  description,
  meta
)
SELECT
  'AquaPulse Portable Water Flosser (Cordless, USB-C)',
  'tiktok_shop',
  'Oral Care',
  39.99,
  'https://example.com/aff/aquapulse-waterflosser',
  'https://images.example.com/aquapulse-waterflosser.jpg',
  'AquaPulse',
  'USD',
  'active',
  'Fresher-feeling clean between teeth with a quick, cordless rinse.',
  'Busy adults, travelers, and anyone who wants easy between-teeth cleaning.',
  'Show a fast, mess-free rinse that fits into a morning routine or travel bag. Highlight USB-C charging and compact storage without making medical claims.',
  jsonb_build_array(
    'Cordless, USB-C rechargeable',
    'Water-resistant body',
    'Multiple pressure modes',
    'Compact travel size',
    'Easy-fill reservoir'
  ),
  jsonb_build_array(
    'Worried about water splashing',
    'Unsure about pressure strength',
    'Concerned about battery life'
  ),
  jsonb_build_array(
    'Sink-side demo with controlled stream',
    'Morning routine before work',
    'Pack-and-go travel pouch clip'
  ),
  'A compact, cordless water flosser designed for quick between-teeth rinsing at home or on the go.',
  jsonb_build_object(
    'offer', 'Portable water flosser with USB-C charging and travel-ready size.',
    'proof_points', jsonb_build_array(
      'Multiple pressure modes',
      'USB-C rechargeable',
      'Compact reservoir'
    ),
    'compliance', jsonb_build_object(
      'avoid_claims', jsonb_build_array(
        'No claims of curing gum disease',
        'No guaranteed whitening results'
      )
    ),
    'cta', 'Upgrade your flossing routine.',
    'creative_angles', jsonb_build_array(
      'Travel-ready oral care',
      'Countertop morning routine',
      'USB-C charge-and-go convenience'
    ),
    'keywords', jsonb_build_array(
      'cordless water flosser',
      'portable oral care',
      'USB-C rechargeable',
      'travel flossing'
    ),
    'key_features', jsonb_build_array(
      'Cordless, USB-C rechargeable',
      'Water-resistant body',
      'Multiple pressure modes',
      'Compact travel size',
      'Easy-fill reservoir'
    ),
    'objections', jsonb_build_array(
      'Worried about water splashing',
      'Unsure about pressure strength',
      'Concerned about battery life'
    ),
    'demo_ideas', jsonb_build_array(
      'Sink-side demo with controlled stream',
      'Morning routine before work',
      'Pack-and-go travel pouch clip'
    )
  )
WHERE NOT EXISTS (
  SELECT 1
  FROM public.products
  WHERE name = 'AquaPulse Portable Water Flosser (Cordless, USB-C)'
    AND source_platform = 'tiktok_shop'
);
INSERT INTO public.products (
  name,
  source_platform,
  category,
  price_usd,
  affiliate_link,
  image_url,
  brand,
  currency,
  status,
  primary_benefit,
  target_audience,
  content_brief,
  key_features,
  objections,
  demo_ideas,
  description,
  meta
)
SELECT
  'LunaTwist Heatless Curling Set (Overnight Curls, No Heat)',
  'tiktok_shop',
  'Beauty',
  24.99,
  'https://example.com/aff/lunatwist-heatless-curls',
  'https://images.example.com/lunatwist-heatless-curls.jpg',
  'LunaTwist',
  'USD',
  'active',
  'Soft, bouncy curls without heat tools or harsh styling.',
  'People who want low-effort, heat-free styling while they sleep.',
  'Show the simple wrap-and-sleep routine and a morning reveal. Emphasize comfort and gentle styling without claiming guaranteed results.',
  jsonb_build_array(
    'Heatless curling rod and clips',
    'Soft satin-like fabric',
    'Overnight-friendly comfort',
    'Works on most hair lengths',
    'No heat damage'
  ),
  jsonb_build_array(
    'Unsure if it works on thick hair',
    'Worried about sleeping comfort',
    'Concerned about curls lasting all day'
  ),
  jsonb_build_array(
    'Step-by-step wrap tutorial',
    'Morning curl reveal',
    'Before/after texture comparison'
  ),
  'A heatless curling set that helps create soft curls overnight with a simple wrap-and-sleep routine.',
  jsonb_build_object(
    'offer', 'Heatless curling set for overnight, no-heat styling.',
    'proof_points', jsonb_build_array(
      'Soft fabric for comfortable sleep',
      'Includes clips for secure hold',
      'No heat tools required'
    ),
    'compliance', jsonb_build_object(
      'avoid_claims', jsonb_build_array(
        'No guaranteed curl longevity',
        'No claims of repairing hair damage'
      )
    ),
    'cta', 'Try a heat-free curl routine tonight.',
    'creative_angles', jsonb_build_array(
      'Overnight transformation',
      'Gentle styling routine',
      'Low-effort beauty hack'
    ),
    'keywords', jsonb_build_array(
      'heatless curls',
      'overnight curling',
      'no heat hair',
      'curling set'
    ),
    'key_features', jsonb_build_array(
      'Heatless curling rod and clips',
      'Soft satin-like fabric',
      'Overnight-friendly comfort',
      'Works on most hair lengths',
      'No heat damage'
    ),
    'objections', jsonb_build_array(
      'Unsure if it works on thick hair',
      'Worried about sleeping comfort',
      'Concerned about curls lasting all day'
    ),
    'demo_ideas', jsonb_build_array(
      'Step-by-step wrap tutorial',
      'Morning curl reveal',
      'Before/after texture comparison'
    )
  )
WHERE NOT EXISTS (
  SELECT 1
  FROM public.products
  WHERE name = 'LunaTwist Heatless Curling Set (Overnight Curls, No Heat)'
    AND source_platform = 'tiktok_shop'
);
INSERT INTO public.products (
  name,
  source_platform,
  category,
  price_usd,
  affiliate_link,
  image_url,
  brand,
  currency,
  status,
  primary_benefit,
  target_audience,
  content_brief,
  key_features,
  objections,
  demo_ideas,
  description,
  meta
)
SELECT
  'StepQuiet Under-Desk Walking Pad (Quiet Motor, Compact)',
  'amazon_affiliate',
  'Fitness',
  219.00,
  'https://example.com/aff/stepquiet-walking-pad',
  'https://images.example.com/stepquiet-walking-pad.jpg',
  'StepQuiet',
  'USD',
  'active',
  'Low-noise walking at a desk to help stay active during work hours.',
  'Remote workers and home office users who want light movement while working.',
  'Demonstrate the quiet motor under a desk setup and show how compact it stores. Focus on gentle activity, not medical outcomes.',
  jsonb_build_array(
    'Quiet motor for office use',
    'Compact, under-desk footprint',
    'Simple speed controls',
    'Low-profile design',
    'Easy roll-away storage'
  ),
  jsonb_build_array(
    'Concerned about noise on calls',
    'Unsure about stability',
    'Worried it is too large for small spaces'
  ),
  jsonb_build_array(
    'Desk walkthrough while typing',
    'Noise comparison with phone mic',
    'Slide-under-bed storage demo'
  ),
  'A compact under-desk walking pad built for low-noise movement while you work.',
  jsonb_build_object(
    'offer', 'Compact walking pad designed for quiet, under-desk use.',
    'proof_points', jsonb_build_array(
      'Quiet motor for calls',
      'Compact footprint',
      'Easy storage wheels'
    ),
    'compliance', jsonb_build_object(
      'avoid_claims', jsonb_build_array(
        'No guaranteed weight loss',
        'No medical or therapeutic claims'
      )
    ),
    'cta', 'Add gentle movement to your workday.',
    'creative_angles', jsonb_build_array(
      'Workday movement',
      'Quiet office setup',
      'Small-space fitness'
    ),
    'keywords', jsonb_build_array(
      'under desk walking pad',
      'quiet treadmill',
      'home office fitness',
      'compact walking'
    ),
    'key_features', jsonb_build_array(
      'Quiet motor for office use',
      'Compact, under-desk footprint',
      'Simple speed controls',
      'Low-profile design',
      'Easy roll-away storage'
    ),
    'objections', jsonb_build_array(
      'Concerned about noise on calls',
      'Unsure about stability',
      'Worried it is too large for small spaces'
    ),
    'demo_ideas', jsonb_build_array(
      'Desk walkthrough while typing',
      'Noise comparison with phone mic',
      'Slide-under-bed storage demo'
    )
  )
WHERE NOT EXISTS (
  SELECT 1
  FROM public.products
  WHERE name = 'StepQuiet Under-Desk Walking Pad (Quiet Motor, Compact)'
    AND source_platform = 'amazon_affiliate'
);
INSERT INTO public.products (
  name,
  source_platform,
  category,
  price_usd,
  affiliate_link,
  image_url,
  brand,
  currency,
  status,
  primary_benefit,
  target_audience,
  content_brief,
  key_features,
  objections,
  demo_ideas,
  description,
  meta
)
SELECT
  'GlowGuard Pet Hair Remover Roller (Reusable, Self-Cleaning)',
  'amazon_affiliate',
  'Home',
  16.99,
  'https://example.com/aff/glowguard-pet-hair-roller',
  'https://images.example.com/glowguard-pet-hair-roller.jpg',
  'GlowGuard',
  'USD',
  'active',
  'Quickly picks up pet hair from furniture without sticky refills.',
  'Pet owners who want a reusable, fast cleanup tool for couches and beds.',
  'Show a fast pass over a couch and the self-cleaning chamber emptying. Emphasize reusability and convenience, not perfect results.',
  jsonb_build_array(
    'Reusable roller with self-cleaning chamber',
    'No sticky refills needed',
    'Works on couches, bedding, and car seats',
    'Ergonomic handle',
    'Easy emptying compartment'
  ),
  jsonb_build_array(
    'Unsure if it works on thick fabrics',
    'Concerned about durability',
    'Wonders if it replaces lint rollers'
  ),
  jsonb_build_array(
    'One-swipe couch cleanup',
    'Empty-the-chamber reveal',
    'Before/after on pet blanket'
  ),
  'A reusable pet hair roller that lifts fur from furniture and stores it in a self-cleaning chamber.',
  jsonb_build_object(
    'offer', 'Reusable pet hair remover roller with self-cleaning chamber.',
    'proof_points', jsonb_build_array(
      'No sticky refills',
      'Easy emptying compartment',
      'Works on common upholstery'
    ),
    'compliance', jsonb_build_object(
      'avoid_claims', jsonb_build_array(
        'No guarantee of removing all hair',
        'No claims of allergy relief'
      )
    ),
    'cta', 'Make pet hair cleanup easy.',
    'creative_angles', jsonb_build_array(
      'Quick couch refresh',
      'Reusable household tool',
      'Pet-owner daily routine'
    ),
    'keywords', jsonb_build_array(
      'pet hair remover',
      'reusable lint roller',
      'self cleaning roller',
      'couch fur cleanup'
    ),
    'key_features', jsonb_build_array(
      'Reusable roller with self-cleaning chamber',
      'No sticky refills needed',
      'Works on couches, bedding, and car seats',
      'Ergonomic handle',
      'Easy emptying compartment'
    ),
    'objections', jsonb_build_array(
      'Unsure if it works on thick fabrics',
      'Concerned about durability',
      'Wonders if it replaces lint rollers'
    ),
    'demo_ideas', jsonb_build_array(
      'One-swipe couch cleanup',
      'Empty-the-chamber reveal',
      'Before/after on pet blanket'
    )
  )
WHERE NOT EXISTS (
  SELECT 1
  FROM public.products
  WHERE name = 'GlowGuard Pet Hair Remover Roller (Reusable, Self-Cleaning)'
    AND source_platform = 'amazon_affiliate'
);
