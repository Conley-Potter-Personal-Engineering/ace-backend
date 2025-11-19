import { getSupabase } from "../db/db";
import type { Tables, TablesInsert, TablesUpdate } from "../db/types";
import { identifierSchema, nullableDateSchema, z } from "./validators";

const agentNoteInsertSchema = z.object({
  agent_name: z.string().min(1, "Agent name is required"),
  content: z.string().min(1, "Note content is required"),
  created_at: nullableDateSchema,
  embedding: z.string().nullable().optional(),
  importance: z.number().nullable().optional(),
  note_id: identifierSchema.optional(),
  topic: z.string().trim().nullable().optional(),
});

const agentNoteUpdateSchema = agentNoteInsertSchema.partial();

const noteIdSchema = identifierSchema.describe("note_id");

export const createAgentNote = async (payload: TablesInsert<"agent_notes">) => {
  const validated = agentNoteInsertSchema.parse(payload);
  const { data, error } = await getSupabase()
    .from("agent_notes")
    .insert(validated)
    .select("*")
    .returns<Tables<"agent_notes">[]>()
    .single();

  if (error) {
    throw new Error(`Failed to create agent note: ${error.message}`);
  }

  return data;
};

export const listAgentNotes = async () => {
  const { data, error } = await getSupabase()
    .from("agent_notes")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Tables<"agent_notes">[]>();

  if (error) {
    throw new Error(`Failed to list agent notes: ${error.message}`);
  }

  return data ?? [];
};

export const getAgentNoteById = async (noteId: string) => {
  const validatedId = noteIdSchema.parse(noteId);
  const { data, error } = await getSupabase()
    .from("agent_notes")
    .select("*")
    .eq("note_id", validatedId)
    .returns<Tables<"agent_notes">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch agent note ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const updateAgentNote = async (
  noteId: string,
  changes: TablesUpdate<"agent_notes">,
) => {
  const validatedId = noteIdSchema.parse(noteId);
  const validatedChanges = agentNoteUpdateSchema.parse(changes);
  const { data, error } = await getSupabase()
    .from("agent_notes")
    .update(validatedChanges)
    .eq("note_id", validatedId)
    .select("*")
    .returns<Tables<"agent_notes">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to update agent note ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const deleteAgentNote = async (noteId: string) => {
  const validatedId = noteIdSchema.parse(noteId);
  const { data, error } = await getSupabase()
    .from("agent_notes")
    .delete()
    .eq("note_id", validatedId)
    .select("*")
    .returns<Tables<"agent_notes">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to delete agent note ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const listNotesForAgent = async (agentName: string) => {
  const validatedAgentName = identifierSchema.parse(agentName);
  const { data, error } = await getSupabase()
    .from("agent_notes")
    .select("*")
    .eq("agent_name", validatedAgentName)
    .order("created_at", { ascending: false })
    .returns<Tables<"agent_notes">[]>();

  if (error) {
    throw new Error(
      `Failed to list notes for agent ${validatedAgentName}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const searchNotesByTopic = async (topicFragment: string) => {
  const validatedFragment = identifierSchema.parse(topicFragment);
  const { data, error } = await getSupabase()
    .from("agent_notes")
    .select("*")
    .ilike("topic", `%${validatedFragment}%`)
    .returns<Tables<"agent_notes">[]>();

  if (error) {
    throw new Error(
      `Failed to search notes by topic ${validatedFragment}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const listImportantNotes = async (minimumImportance = 0.8) => {
  const validatedThreshold = z.number().min(0).max(1).parse(minimumImportance);
  const { data, error } = await getSupabase()
    .from("agent_notes")
    .select("*")
    .gte("importance", validatedThreshold)
    .order("importance", { ascending: false })
    .returns<Tables<"agent_notes">[]>();

  if (error) {
    throw new Error(
      `Failed to list important notes with threshold ${validatedThreshold}: ${error.message}`,
    );
  }

  return data ?? [];
};
