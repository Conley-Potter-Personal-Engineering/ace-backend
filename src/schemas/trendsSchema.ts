import { z } from "zod";

const metadataSchema = z.record(z.any());
const tagArraySchema = z.array(z.string().trim().min(1));

export const trendSnapshotInputSchema = z.object({
  productId: z.string().uuid(),
  snapshotTime: z.string().datetime().optional(),
  competitionScore: z.number().min(0).optional(),
  popularityScore: z.number().min(0).optional(),
  velocityScore: z.number().min(0).optional(),
  tiktokTrendTags: tagArraySchema.optional(),
  rawSourceData: metadataSchema.optional(),
});

export type TrendSnapshotInputDTO = z.infer<typeof trendSnapshotInputSchema>;
