import { z } from "zod";

const metadataSchema = z.record(z.any());

export const embeddingInputSchema = z.object({
  embedding: z.string().trim().min(1, "Embedding vector is required"),
  metadata: metadataSchema.optional(),
  referenceId: z.string().uuid(),
  referenceType: z.string().trim().min(1, "Reference type is required"),
});

export type EmbeddingInputDTO = z.infer<typeof embeddingInputSchema>;
