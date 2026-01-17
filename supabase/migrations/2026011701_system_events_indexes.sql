-- ============================================================
-- ACE System Events: Filter/Search Indexes
-- ============================================================

create index if not exists system_events_created_at_idx
  on system_events (created_at desc);

create index if not exists system_events_severity_idx
  on system_events (severity);

create index if not exists system_events_event_type_idx
  on system_events (event_type);

create index if not exists system_events_event_category_idx
  on system_events (event_category);

create index if not exists system_events_correlation_id_idx
  on system_events (correlation_id);

create index if not exists system_events_workflow_id_idx
  on system_events (workflow_id);

create index if not exists system_events_agent_name_idx
  on system_events (agent_name);

create index if not exists system_events_search_idx
  on system_events
  using gin (to_tsvector('english', coalesce(message, '') || ' ' || coalesce(metadata::text, '')));

-- ============================================================
-- End of migration
-- ============================================================
