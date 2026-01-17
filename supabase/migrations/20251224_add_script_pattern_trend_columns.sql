-- Add dedicated columns for creative pattern and trend references on scripts.

alter table scripts
  add column if not exists creative_pattern_id uuid references creative_patterns(pattern_id) on delete set null,
  add column if not exists trend_reference uuid references trend_snapshots(snapshot_id) on delete set null;
create index if not exists idx_scripts_creative_pattern_id
  on scripts(creative_pattern_id);
create index if not exists idx_scripts_trend_reference
  on scripts(trend_reference);
update scripts
set creative_pattern_id = (creative_variables->>'creativePatternId')::uuid
where creative_pattern_id is null
  and creative_variables ? 'creativePatternId';
update scripts
set trend_reference = (creative_variables->>'trendReference')::uuid
where trend_reference is null
  and creative_variables ? 'trendReference';
