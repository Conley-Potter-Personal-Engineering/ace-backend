import { z } from "zod";

const positiveInt = z.number().int().nonnegative();

export const performanceMetricInputSchema = z.object({
  collectedAt: z.string().datetime().optional(),
  commentCount: positiveInt.optional(),
  completionRate: z.number().min(0).optional(),
  likeCount: positiveInt.optional(),
  postId: z.string().uuid().optional(),
  shareCount: positiveInt.optional(),
  viewCount: positiveInt.optional(),
  watchTimeMs: positiveInt.optional(),
});

export type PerformanceMetricInputDTO = z.infer<typeof performanceMetricInputSchema>;
