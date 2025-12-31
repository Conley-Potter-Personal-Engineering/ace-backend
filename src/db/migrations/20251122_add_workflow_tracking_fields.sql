-- Add workflow_id and correlation_id as top-level columns
ALTER TABLE system_events
  ADD COLUMN workflow_id TEXT,
  ADD COLUMN correlation_id TEXT;

-- Create indexes for efficient querying
CREATE INDEX idx_system_events_workflow_id ON system_events(workflow_id);
CREATE INDEX idx_system_events_correlation_id ON system_events(correlation_id);
CREATE INDEX idx_system_events_agent_name ON system_events(agent_name);
CREATE INDEX idx_system_events_event_type ON system_events(event_type);
