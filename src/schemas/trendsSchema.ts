import { z } from "zod";

const MetadataSchema = z.record(z.any());
const TagArraySchema = z.array(z.string().trim().min(1));

export const TrendSnapshotInputSchema = z.object({
  productId: z.string().uuid(),
  snapshotTime: z.string().datetime().optional(),
  competitionScore: z.number().min(0).optional(),
  popularityScore: z.number().min(0).optional(),
  velocityScore: z.number().min(0).optional(),
  tiktokTrendTags: TagArraySchema.optional(),
  rawSourceData: MetadataSchema.optional(),
});

export type TrendSnapshotInput = z.infer<typeof TrendSnapshotInputSchema>;
