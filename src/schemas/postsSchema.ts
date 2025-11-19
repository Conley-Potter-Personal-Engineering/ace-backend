import { z } from "zod";

const hashtagsSchema = z.array(z.string().trim().min(1));

export const publishedPostInputSchema = z.object({
  platform: z.string().trim().min(1, "Platform is required"),
  caption: z.string().trim().min(1).optional(),
  experimentId: z.string().uuid().optional(),
  hashtags: hashtagsSchema.optional(),
  platformPostId: z.string().trim().min(1).optional(),
  postedAt: z.string().datetime().optional(),
});

export type PublishedPostInputDTO = z.infer<typeof publishedPostInputSchema>;
