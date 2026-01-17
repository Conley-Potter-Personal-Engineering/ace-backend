-- ============================================================
-- ACE System Events: Category + Severity + Message + Metadata
-- ============================================================

alter table if exists system_events
  add column if not exists event_category text,
  add column if not exists severity text,
  add column if not exists message text,
  add column if not exists metadata jsonb;
-- ============================================================
-- End of migration
-- ============================================================;
