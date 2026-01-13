import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/db/types";
import { logSystemEvent } from "@/repos/systemEvents";
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
