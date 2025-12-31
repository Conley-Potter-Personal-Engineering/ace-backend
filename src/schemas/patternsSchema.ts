import { z } from "zod";

const ObservedPerformanceSchema = z.record(z.union([z.string(), z.number()]));

export const CreativePatternSchema = z.object({
  pattern_id: z.string().uuid(),
  product_id: z.string().uuid(),
  hook_text: z.string().nullable(),
  structure: z.string().nullable(),
  style_tags: z.array(z.string()).default([]),
  emotion_tags: z.array(z.string()).default([]),
  observed_performance: ObservedPerformanceSchema.nullable(),
  notes: z.string().nullable(),
  created_at: z.string().datetime(),
});

export const CreativePatternInputSchema = CreativePatternSchema;

export type CreativePattern = z.infer<typeof CreativePatternSchema>;
export type CreativePatternInput = z.infer<typeof CreativePatternInputSchema>;
