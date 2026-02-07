import { z } from "zod";

export const AgentNoteInputSchema = z.object({
  agentName: z.string().trim().min(1, "Agent name is required"),
  content: z.string().trim().min(1, "Note content is required"),
  embedding: z.string().trim().min(1).optional(),
  importance: z.number().int().min(1).max(5).optional(),
  topic: z.string().trim().min(1).optional(),
});

export type AgentNoteInput = z.infer<typeof AgentNoteInputSchema>;
