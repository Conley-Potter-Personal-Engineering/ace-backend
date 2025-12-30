import { z } from "zod";

const PositiveIntSchema = z.number().int().nonnegative();

export const PerformanceMetricInputSchema = z.object({
  collectedAt: z.string().datetime().optional(),
  commentCount: PositiveIntSchema.optional(),
  completionRate: z.number().min(0).optional(),
  likeCount: PositiveIntSchema.optional(),
  postId: z.string().uuid().optional(),
  shareCount: PositiveIntSchema.optional(),
  viewCount: PositiveIntSchema.optional(),
  watchTimeMs: PositiveIntSchema.optional(),
});

export type PerformanceMetricInput = z.infer<typeof PerformanceMetricInputSchema>;
