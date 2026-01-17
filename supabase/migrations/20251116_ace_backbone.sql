-- ============================================================
-- ACE Autonomous Content Engine
-- Month-One Data Backbone Additions
-- Compatible with existing Supabase schema
-- ============================================================

-- NOTE:
-- We are assuming these existing tables ALREADY exist:
--   products
--   agent_notes
--   creative_patterns
--   embeddings
--   raw_videos
--   trend_snapshots
--
-- This migration ONLY adds missing backbone tables and indexes.
-- ============================================================


-- ============================
-- 1. SCRIPTS
-- ============================

create table if not exists scripts (
  script_id uuid primary key default gen_random_uuid(),
  product_id uuid references products(product_id) on delete cascade,
  script_text text not null,
  hook text,
  creative_variables jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_scripts_product_id
  on scripts(product_id);
-- ============================
-- 2. VIDEO ASSETS
-- ============================

create table if not exists video_assets (
  asset_id uuid primary key default gen_random_uuid(),
  script_id uuid references scripts(script_id) on delete set null,
  storage_path text not null,
  thumbnail_path text,
  duration_seconds int,
  created_at timestamptz default now()
);
create index if not exists idx_video_assets_script_id
  on video_assets(script_id);
-- ============================
-- 3. EXPERIMENTS
-- ============================

create table if not exists experiments (
  experiment_id uuid primary key default gen_random_uuid(),
  product_id uuid references products(product_id) on delete cascade,
  script_id uuid references scripts(script_id) on delete set null,
  asset_id uuid references video_assets(asset_id) on delete set null,
  hypothesis text,
  variation_label text,
  created_at timestamptz default now()
);
create index if not exists idx_experiments_product_id
  on experiments(product_id);
create index if not exists idx_experiments_script_id
  on experiments(script_id);
create index if not exists idx_experiments_created_at
  on experiments(created_at);
-- ============================
-- 4. PUBLISHED POSTS
-- ============================

create table if not exists published_posts (
  post_id uuid primary key default gen_random_uuid(),
  experiment_id uuid references experiments(experiment_id) on delete cascade,
  platform text not null,
  platform_post_id text,
  caption text,
  hashtags text[],
  posted_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_published_posts_experiment_id
  on published_posts(experiment_id);
create index if not exists idx_published_posts_platform
  on published_posts(platform);
-- ============================
-- 5. PERFORMANCE METRICS
-- ============================

create table if not exists performance_metrics (
  metric_id uuid primary key default gen_random_uuid(),
  post_id uuid references published_posts(post_id) on delete cascade,
  view_count bigint,
  like_count int,
  share_count int,
  comment_count int,
  watch_time_ms bigint,
  completion_rate numeric,
  collected_at timestamptz default now()
);
create index if not exists idx_performance_metrics_post_id
  on performance_metrics(post_id);
create index if not exists idx_performance_metrics_collected_at
  on performance_metrics(collected_at);
-- ============================
-- 6. SYSTEM EVENTS
-- ============================

create table if not exists system_events (
  event_id uuid primary key default gen_random_uuid(),
  agent_name text,
  event_type text not null,
  payload jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_system_events_agent_name
  on system_events(agent_name);
create index if not exists idx_system_events_event_type
  on system_events(event_type);
create index if not exists idx_system_events_created_at
  on system_events(created_at);
-- ============================
-- 7. OPTIONAL INDEXES ON EXISTING TABLES
-- ============================
-- These are safe and purely performance-oriented. If they already
-- exist, the "if not exists" will no-op.

-- creative_patterns.product_id
create index if not exists idx_creative_patterns_product_id
  on creative_patterns(product_id);
-- trend_snapshots.product_id
create index if not exists idx_trend_snapshots_product_id
  on trend_snapshots(product_id);
-- raw_videos.platform + external_id
create index if not exists idx_raw_videos_platform_external
  on raw_videos(platform, external_id);
-- ============================================================
-- END OF MIGRATION
-- ============================================================;
