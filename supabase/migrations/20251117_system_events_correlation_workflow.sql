-- ============================================================
-- ACE System Events: Correlation + Workflow Columns
-- ============================================================

alter table if exists system_events
  add column if not exists correlation_id text,
  add column if not exists workflow_id text;

create index if not exists idx_system_events_correlation_id
  on system_events(correlation_id);

create index if not exists idx_system_events_workflow_id
  on system_events(workflow_id);

do $$
declare
  event_col text;
  time_col text;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'system_events'
      and column_name = 'event_type'
  ) then
    event_col := 'event_type';
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'system_events'
      and column_name = 'type'
  ) then
    event_col := 'type';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'system_events'
      and column_name = 'created_at'
  ) then
    time_col := 'created_at';
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'system_events'
      and column_name = 'inserted_at'
  ) then
    time_col := 'inserted_at';
  end if;

  if event_col is not null and time_col is not null then
    execute format(
      'create index if not exists %I on system_events(%I, %I)',
      'idx_system_events_' || event_col || '_' || time_col,
      event_col,
      time_col
    );
  end if;
end $$;

update system_events
set correlation_id = payload->>'correlationId'
where correlation_id is null
  and payload is not null
  and payload ? 'correlationId';

update system_events
set workflow_id = coalesce(payload->>'workflowId', payload->>'workflow')
where workflow_id is null
  and payload is not null
  and (
    payload ? 'workflowId'
    or payload ? 'workflow'
  );

-- ============================================================
-- End of migration
-- ============================================================
