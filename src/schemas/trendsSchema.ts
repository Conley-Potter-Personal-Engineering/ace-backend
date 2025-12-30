import { z } from "zod";

const TagArraySchema = z.array(z.string());
const RawSourceDataSchema = z.record(z.any());

export const TrendSnapshotSchema = z.object({
  snapshot_id: z.string().uuid(),
  product_id: z.string().uuid(),
  popularity_score: z.number().min(0).max(100),
  velocity_score: z.number(),
  competition_score: z.number().nullable(),
  tiktok_trend_tags: TagArraySchema.default([]),
  raw_source_data: RawSourceDataSchema.nullable(),
  snapshot_time: z.string().datetime(),
});

export const TrendSnapshotInputSchema = TrendSnapshotSchema;

export type TrendSnapshot = z.infer<typeof TrendSnapshotSchema>;
export type TrendSnapshotInput = z.infer<typeof TrendSnapshotInputSchema>;
