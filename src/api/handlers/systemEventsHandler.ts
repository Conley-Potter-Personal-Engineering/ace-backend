import { getSupabase } from "@/db/supabase";
import {
  createSystemEvent,
  getSystemEvents,
} from "@/lib/api/repositories/systemEventsRepository";
import { buildPagination } from "@/lib/api/utils/pagination";
import { SystemEventsQuerySchema } from "@/schemas/apiSchemas";
import { SystemEventCreateSchema } from "@/schemas/systemEventsSchema";

export const listSystemEventsApi = async (
  rawQuery: Record<string, string | undefined>,
) => {
  const parsed = SystemEventsQuerySchema.parse(rawQuery);
  const limit = parsed.limit ?? 100;
  const offset = parsed.offset ?? 0;
  const { events, total } = await getSystemEvents(getSupabase(), {
    severity: parsed.severity,
    agent_name: parsed.agent_name,
    event_type: parsed.event_type,
    event_category: parsed.event_category,
    workflow_id: parsed.workflow_id,
    correlation_id: parsed.correlation_id,
    start_date: parsed.start_date,
    end_date: parsed.end_date,
    search: parsed.search,
    limit,
    offset,
  });

  const data = events.map((event) => ({
    id: event.event_id,
    timestamp: event.created_at ?? new Date().toISOString(),
    severity: event.severity ?? "info",
    event_type: event.event_type,
    event_category: event.event_category ?? "system",
    message: event.message ?? "",
    workflow_id: event.workflow_id ?? null,
    correlation_id: event.correlation_id ?? null,
    agent_name: event.agent_name ?? null,
    metadata: event.metadata ?? null,
  }));

  return {
    data,
    pagination: buildPagination(total, limit, offset),
  };
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
