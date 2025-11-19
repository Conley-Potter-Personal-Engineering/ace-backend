import { getSupabase } from "../db/db";
import type { Tables, TablesInsert, TablesUpdate } from "../db/types";
import { identifierSchema, jsonSchema, nullableDateSchema, z } from "./validators";

const systemEventInsertSchema = z.object({
    agent_name: z.string().trim().nullable().optional(),
    created_at: nullableDateSchema,
    event_id: identifierSchema.optional(),
    event_type: z.string().min(1, "Event type is required"),
    payload: jsonSchema.nullable().optional(),
  });

const systemEventUpdateSchema = systemEventInsertSchema.partial();

const eventIdSchema = identifierSchema.describe("event_id");

export const logSystemEvent = async (
  payload: TablesInsert<"system_events">,
) => {
  const validated = systemEventInsertSchema.parse(payload);
  const { data, error } = await getSupabase()
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
