import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/db/types";
import { logSystemEvent, querySystemEvents } from "@/repos/systemEvents";
import type { SystemEventCreateInput } from "@/schemas/systemEventsSchema";

export const createSystemEvent = async (
  supabase: SupabaseClient<Database>,
  event: SystemEventCreateInput,
): Promise<Tables<"system_events">> => {
  const payload = event.metadata ?? null;

  return logSystemEvent(
    {
      agent_name: event.agent_name ?? null,
      correlation_id: event.correlation_id ?? null,
      workflow_id: event.workflow_id ?? null,
      event_type: event.event_type,
      event_category: event.event_category,
      severity: event.severity,
      message: event.message,
      metadata: event.metadata ?? null,
      payload,
    },
    supabase,
  );
};

export interface SystemEventsFilters {
  severity?: "debug" | "info" | "warning" | "error" | "critical";
  agent_name?: string;
  event_type?: string;
  event_category?: "workflow" | "agent" | "system" | "integration";
  workflow_id?: string;
  correlation_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const getSystemEvents = async (
  supabase: SupabaseClient<Database>,
  filters: SystemEventsFilters,
): Promise<{ events: Tables<"system_events">[]; total: number }> => {
  return querySystemEvents(filters, supabase);
};
