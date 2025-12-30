import { z } from "zod";

const TagArraySchema = z.array(z.string().trim().min(1));
const PositiveIntSchema = z.number().int().nonnegative();

export const VideoAssetInputSchema = z.object({
  storagePath: z.string().trim().min(1, "Storage path is required"),
  scriptId: z.string().uuid().optional(),
  durationSeconds: PositiveIntSchema.optional(),
  thumbnailPath: z.string().trim().min(1).optional(),
});

export type VideoAssetInput = z.infer<typeof VideoAssetInputSchema>;

export const RawVideoInputSchema = z.object({
  externalId: z.string().trim().min(1, "External id is required"),
  platform: z.string().trim().min(1, "Platform is required"),
  author: z.string().trim().min(1).optional(),
  caption: z.string().trim().min(1).optional(),
  collectedAt: z.string().datetime().optional(),
  hashtags: TagArraySchema.optional(),
  commentCount: PositiveIntSchema.optional(),
  likeCount: PositiveIntSchema.optional(),
  shareCount: PositiveIntSchema.optional(),
  viewCount: PositiveIntSchema.optional(),
});

export type RawVideoInput = z.infer<typeof RawVideoInputSchema>;
