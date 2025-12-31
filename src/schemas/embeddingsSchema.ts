import { z } from "zod";

const MetadataSchema = z.record(z.any());

export const EmbeddingInputSchema = z.object({
  embedding: z.string().trim().min(1, "Embedding vector is required"),
  metadata: MetadataSchema.optional(),
  referenceId: z.string().uuid(),
  referenceType: z.string().trim().min(1, "Reference type is required"),
});

export type EmbeddingInput = z.infer<typeof EmbeddingInputSchema>;
