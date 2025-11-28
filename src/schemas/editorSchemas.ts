import { z } from "zod";

export const editorAgentInputSchema = z.object({
  scriptId: z.string().uuid("scriptId must be a valid UUID"),
  overrideStoragePath: z.string().trim().min(1).optional(),
});

export type EditorAgentInput = z.infer<typeof editorAgentInputSchema>;

export const editorChainOutputSchema = z.object({
  storagePath: z.string().trim().min(1, "Storage path is required"),
  durationSeconds: z.number().int().positive().optional(),
  thumbnailPath: z.string().trim().min(1).optional(),
  metadata: z.object({
    title: z.string().trim().min(1, "Title is required"),
    summary: z.string().trim().min(1, "Summary is required"),
    beats: z.array(
      z.object({
        timestamp: z.string().trim().min(1),
        visual: z.string().trim().min(1),
        narration: z.string().trim().min(1),
      }),
    ),
    soundtrack: z.string().trim().min(1).optional(),
    transitions: z.string().trim().min(1).optional(),
  }),
});

export type EditorChainOutput = z.infer<typeof editorChainOutputSchema>;
