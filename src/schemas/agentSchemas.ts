import { z } from "zod";

export const scriptwriterAgentInputSchema = z.object({
  productId: z.string().uuid("productId must be a valid UUID"),
  warmupNotes: z.array(z.string().trim().min(1)).optional(),
});

export type ScriptwriterAgentInput = z.infer<typeof scriptwriterAgentInputSchema>;
