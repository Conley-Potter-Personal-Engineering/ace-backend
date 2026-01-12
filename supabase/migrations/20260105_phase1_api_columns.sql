-- Phase 1 API schema updates for scripts, video assets, and published posts.

alter table scripts
  add column if not exists title text,
  add column if not exists cta text,
  add column if not exists outline text;

-- Remove legacy scripts that predate title/cta/outline additions.
delete from scripts
where title is null
  and cta is null
  and outline is null;

alter table video_assets
  add column if not exists tone text,
  add column if not exists layout text,
  add column if not exists style_tags text[] default '{}',
  add column if not exists metadata jsonb;

alter table published_posts
  add column if not exists workflow_id text,
  add column if not exists correlation_id text;

-- Indexes for Phase 1 API queries.
create index if not exists idx_scripts_created_at
  on scripts(created_at);

create index if not exists idx_video_assets_created_at
  on video_assets(created_at);

create index if not exists idx_published_posts_created_at
  on published_posts(created_at);

create index if not exists idx_performance_metrics_collected_at
  on performance_metrics(collected_at);

create index if not exists idx_products_created_at
  on products(created_at);

create index if not exists idx_agent_notes_created_at
  on agent_notes(created_at);

create index if not exists idx_creative_patterns_created_at
  on creative_patterns(created_at);

create index if not exists idx_raw_videos_created_at
  on raw_videos(created_at);
