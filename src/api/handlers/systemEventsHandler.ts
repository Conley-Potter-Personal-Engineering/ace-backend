import { getSupabase } from "@/db/supabase";
import { createSystemEvent } from "@/lib/api/repositories/systemEventsRepository";
import { fetchRecentSystemEvents } from "@/repos/systemEvents";
import { SystemEventsQuerySchema } from "@/schemas/apiSchemas";
import { SystemEventCreateSchema } from "@/schemas/systemEventsSchema";

export const listSystemEventsApi = async (
  rawQuery: Record<string, string | undefined>,
) => {
  const parsed = SystemEventsQuerySchema.parse(rawQuery);
  const limit = parsed.limit ?? 50;
  const events = await fetchRecentSystemEvents(limit);
  return events;
};

export const createSystemEventApi = async (rawBody: unknown) => {
  const event = SystemEventCreateSchema.parse(rawBody ?? {});
  const created = await createSystemEvent(getSupabase(), event);

  return {
    id: created.event_id,
    timestamp: created.created_at ?? new Date().toISOString(),
    event_type: created.event_type,
    severity: created.severity ?? event.severity,
  };
};
