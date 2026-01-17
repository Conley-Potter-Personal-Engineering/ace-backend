import { getSupabase } from "@/db/supabase";
import {
  createSystemEvent,
  getSystemEventById,
  getSystemEventsByCorrelationId,
  getSystemEventsByWorkflowId,
  getSystemEvents,
} from "@/lib/api/repositories/systemEventsRepository";
import { buildPagination } from "@/lib/api/utils/pagination";
import {
  SystemEventIdParamSchema,
  SystemEventsQuerySchema,
} from "@/schemas/apiSchemas";
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

const MAX_RELATED_EVENTS = 50;

const toEventSummary = (event: {
  event_id: string;
  created_at: string | null;
  event_type: string;
  severity: string | null;
  message: string | null;
}) => ({
  id: event.event_id,
  timestamp: event.created_at ?? new Date().toISOString(),
  event_type: event.event_type,
  severity: event.severity ?? "info",
  message: event.message ?? "",
});

export const getSystemEventDetailApi = async (eventId: string) => {
  const validatedId = SystemEventIdParamSchema.parse(eventId);
  const supabase = getSupabase();
  const event = await getSystemEventById(supabase, validatedId);

  if (!event) {
    return null;
  }

  let relatedEvents: Array<ReturnType<typeof toEventSummary>> = [];
  if (event.correlation_id) {
    const related = await getSystemEventsByCorrelationId(
      supabase,
      event.correlation_id,
      { excludeEventId: event.event_id, limit: MAX_RELATED_EVENTS },
    );
    relatedEvents = related.map(toEventSummary);
  } else if (event.workflow_id) {
    const related = await getSystemEventsByWorkflowId(
      supabase,
      event.workflow_id,
      { excludeEventId: event.event_id, limit: MAX_RELATED_EVENTS },
    );
    relatedEvents = related.map(toEventSummary);
  }

  return {
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
    related_events: relatedEvents,
  };
};
