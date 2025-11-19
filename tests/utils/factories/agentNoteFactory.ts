import { randomUUID } from "crypto";
import type { Tables } from "../../../src/db/types";

export const buildAgentNote = (
  overrides: Partial<Tables<"agent_notes">> = {},
): Tables<"agent_notes"> => ({
  note_id: randomUUID(),
  agent_name: "ScriptwriterAgent",
  content: "This is a synthetic note for testing",
  topic: "script_generation",
  created_at: new Date().toISOString(),
  embedding: null,
  importance: null,
  ...overrides,
});
