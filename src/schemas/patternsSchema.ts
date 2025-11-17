import { z } from "zod";

const metadataSchema = z.record(z.any());
const tagArraySchema = z.array(z.string().trim().min(1));

export const creativePatternInputSchema = z.object({
  hookText: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
  observedPerformance: metadataSchema.optional(),
  productId: z.string().uuid().optional(),
  structure: z.string().trim().min(1).optional(),
  styleTags: tagArraySchema.optional(),
  emotionTags: tagArraySchema.optional(),
});

export type CreativePatternInputDTO = z.infer<typeof creativePatternInputSchema>;
