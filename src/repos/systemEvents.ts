import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "../db/db";
import type { Database, Tables, TablesInsert, TablesUpdate } from "../db/types";
import { identifierSchema, jsonSchema, nullableDateSchema, z } from "./validators";

const eventCategorySchema = z.enum([
  "workflow",
  "agent",
  "system",
  "integration",
]);

const severitySchema = z.enum([
  "debug",
  "info",
  "warning",
  "error",
  "critical",
]);

const systemEventInsertSchema = z.object({
  agent_name: z.string().trim().min(1).max(100).nullable().optional(),
  correlation_id: z.string().trim().min(1).max(100).nullable().optional(),
  workflow_id: z.string().trim().min(1).max(100).nullable().optional(),
  event_category: eventCategorySchema.optional(),
  severity: severitySchema.optional(),
  message: z.string().trim().min(1).max(500).nullable().optional(),
  metadata: jsonSchema.nullable().optional(),
  created_at: nullableDateSchema,
  event_id: identifierSchema.optional(),
  event_type: z.string().min(1, "Event type is required").max(100),
  payload: jsonSchema.nullable().optional(),
});

const systemEventUpdateSchema = systemEventInsertSchema.partial();

const eventIdSchema = identifierSchema.describe("event_id");

export const logSystemEvent = async (
  payload: TablesInsert<"system_events">,
  supabase: SupabaseClient<Database> = getSupabase(),
) => {
  const validated = systemEventInsertSchema.parse(payload);
  const { data, error } = await supabase
    .from("system_events")
    .insert(validated)
    .select("*")
    .returns<Tables<"system_events">[]>()
    .single();

  if (error) {
    throw new Error(`Failed to log system event: ${error.message}`);
  }

  return data;
};

export const listSystemEvents = async () => {
  const { data, error } = await getSupabase()
    .from("system_events")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Tables<"system_events">[]>();

  if (error) {
    throw new Error(`Failed to list system events: ${error.message}`);
  }

  return data ?? [];
};

export const getSystemEventById = async (eventId: string) => {
  const validatedId = eventIdSchema.parse(eventId);
  const { data, error } = await getSupabase()
    .from("system_events")
    .select("*")
    .eq("event_id", validatedId)
    .returns<Tables<"system_events">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch system event ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const fetchSystemEventById = async (
  eventId: string,
  supabase: SupabaseClient<Database> = getSupabase(),
) => {
  const validatedId = eventIdSchema.parse(eventId);
  const { data, error } = await supabase
    .from("system_events")
    .select("*")
    .eq("event_id", validatedId)
    .returns<Tables<"system_events">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch system event ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

const sanitizeLimit = (limit: number | undefined, max: number) => {
  if (!Number.isInteger(limit) || (limit ?? 0) <= 0) {
    return max;
  }
  return Math.min(limit as number, max);
};

export const listSystemEventsByCorrelationId = async (
  correlationId: string,
  options?: { excludeEventId?: string; limit?: number },
  supabase: SupabaseClient<Database> = getSupabase(),
) => {
  const validatedCorrelation = identifierSchema.parse(correlationId);
  const sanitizedLimit = sanitizeLimit(options?.limit, 50);

  let query = supabase
    .from("system_events")
    .select("*")
    .eq("correlation_id", validatedCorrelation)
    .order("created_at", { ascending: true })
    .limit(sanitizedLimit);

  if (options?.excludeEventId) {
    query = query.neq("event_id", options.excludeEventId);
  }

  const { data, error } = await query.returns<Tables<"system_events">[]>();

  if (error) {
    throw new Error(
      `Failed to list system events by correlation_id ${validatedCorrelation}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const listSystemEventsByWorkflowId = async (
  workflowId: string,
  options?: { excludeEventId?: string; limit?: number },
  supabase: SupabaseClient<Database> = getSupabase(),
) => {
  const validatedWorkflow = identifierSchema.parse(workflowId);
  const sanitizedLimit = sanitizeLimit(options?.limit, 50);

  let query = supabase
    .from("system_events")
    .select("*")
    .eq("workflow_id", validatedWorkflow)
    .order("created_at", { ascending: true })
    .limit(sanitizedLimit);

  if (options?.excludeEventId) {
    query = query.neq("event_id", options.excludeEventId);
  }

  const { data, error } = await query.returns<Tables<"system_events">[]>();

  if (error) {
    throw new Error(
      `Failed to list system events by workflow_id ${validatedWorkflow}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const updateSystemEvent = async (
  eventId: string,
  changes: TablesUpdate<"system_events">,
) => {
  const validatedId = eventIdSchema.parse(eventId);
  const validatedChanges = systemEventUpdateSchema.parse(changes);
  const { data, error } = await getSupabase()
    .from("system_events")
    .update(validatedChanges)
    .eq("event_id", validatedId)
    .select("*")
    .returns<Tables<"system_events">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to update system event ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const deleteSystemEvent = async (eventId: string) => {
  const validatedId = eventIdSchema.parse(eventId);
  const { data, error } = await getSupabase()
    .from("system_events")
    .delete()
    .eq("event_id", validatedId)
    .select("*")
    .returns<Tables<"system_events">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to delete system event ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const listEventsForAgent = async (agentName: string) => {
  const validatedAgent = identifierSchema.parse(agentName);
  const { data, error } = await getSupabase()
    .from("system_events")
    .select("*")
    .eq("agent_name", validatedAgent)
    .order("created_at", { ascending: false })
    .returns<Tables<"system_events">[]>();

  if (error) {
    throw new Error(
      `Failed to list events for agent ${validatedAgent}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const listEventsByType = async (eventType: string) => {
  const validatedType = identifierSchema.parse(eventType);
  const { data, error } = await getSupabase()
    .from("system_events")
    .select("*")
    .eq("event_type", validatedType)
    .order("created_at", { ascending: false })
    .returns<Tables<"system_events">[]>();

  if (error) {
    throw new Error(
      `Failed to list events of type ${validatedType}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const fetchRecentSystemEvents = async (limit = 50) => {
  const validatedLimit = z.number().int().positive().parse(limit);
  const { data, error } = await getSupabase()
    .from("system_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(validatedLimit)
    .returns<Tables<"system_events">[]>();

  if (error) {
    throw new Error(`Failed to fetch recent system events: ${error.message}`);
  }

  return data ?? [];
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

export const querySystemEvents = async (
  filters: SystemEventsFilters,
  supabase: SupabaseClient<Database> = getSupabase(),
) => {
  let query = supabase
    .from("system_events")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.severity) {
    query = query.eq("severity", filters.severity);
  }

  if (filters.agent_name) {
    query = query.eq("agent_name", filters.agent_name);
  }

  if (filters.event_type) {
    query = query.eq("event_type", filters.event_type);
  }

  if (filters.event_category) {
    query = query.eq("event_category", filters.event_category);
  }

  if (filters.workflow_id) {
    query = query.eq("workflow_id", filters.workflow_id);
  }

  if (filters.correlation_id) {
    query = query.eq("correlation_id", filters.correlation_id);
  }

  if (filters.start_date) {
    query = query.gte("created_at", filters.start_date);
  }

  if (filters.end_date) {
    query = query.lte("created_at", filters.end_date);
  }

  if (filters.search) {
    const trimmed = filters.search.trim();
    if (trimmed) {
      const escaped = trimmed.replace(/[%_]/g, "\\$&");
      query = query.or(
        `message.ilike.%${escaped}%,metadata::text.ilike.%${escaped}%`,
      );
    }
  }

  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;
  query = query.range(offset, Math.max(offset + limit - 1, offset));

  const { data, error, count } = await query.returns<Tables<"system_events">[]>();

  if (error) {
    throw new Error(`Failed to list system events: ${error.message}`);
  }

  return {
    events: data ?? [],
    total: count ?? 0,
  };
};
