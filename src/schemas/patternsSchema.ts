import { z } from "zod";

const MetadataSchema = z.record(z.any());
const TagArraySchema = z.array(z.string().trim().min(1));

export const CreativePatternInputSchema = z.object({
  hookText: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
  observedPerformance: MetadataSchema.optional(),
  productId: z.string().uuid().optional(),
  structure: z.string().trim().min(1).optional(),
  styleTags: TagArraySchema.optional(),
  emotionTags: TagArraySchema.optional(),
});

export type CreativePatternInput = z.infer<typeof CreativePatternInputSchema>;
