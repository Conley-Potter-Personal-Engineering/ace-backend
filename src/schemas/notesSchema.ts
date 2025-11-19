import { z } from "zod";

export const agentNoteInputSchema = z.object({
  agentName: z.string().trim().min(1, "Agent name is required"),
  content: z.string().trim().min(1, "Note content is required"),
  embedding: z.string().trim().min(1).optional(),
  importance: z.number().min(0).max(1).optional(),
  topic: z.string().trim().min(1).optional(),
});

export type AgentNoteInputDTO = z.infer<typeof agentNoteInputSchema>;
