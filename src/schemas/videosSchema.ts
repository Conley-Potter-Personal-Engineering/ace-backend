import { z } from "zod";

const tagArraySchema = z.array(z.string().trim().min(1));
const positiveInt = z.number().int().nonnegative();

export const videoAssetInputSchema = z.object({
  storagePath: z.string().trim().min(1, "Storage path is required"),
  scriptId: z.string().uuid().optional(),
  durationSeconds: positiveInt.optional(),
  thumbnailPath: z.string().trim().min(1).optional(),
});

export type VideoAssetInputDTO = z.infer<typeof videoAssetInputSchema>;

export const rawVideoInputSchema = z.object({
  externalId: z.string().trim().min(1, "External id is required"),
  platform: z.string().trim().min(1, "Platform is required"),
  author: z.string().trim().min(1).optional(),
  caption: z.string().trim().min(1).optional(),
  collectedAt: z.string().datetime().optional(),
  hashtags: tagArraySchema.optional(),
  commentCount: positiveInt.optional(),
  likeCount: positiveInt.optional(),
  shareCount: positiveInt.optional(),
  viewCount: positiveInt.optional(),
});

export type RawVideoInputDTO = z.infer<typeof rawVideoInputSchema>;
