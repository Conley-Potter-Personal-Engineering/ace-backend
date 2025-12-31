import { z } from "zod";

const HashtagsSchema = z.array(z.string().trim().min(1));

export const PublishedPostInputSchema = z.object({
  platform: z.string().trim().min(1, "Platform is required"),
  caption: z.string().trim().min(1).optional(),
  experimentId: z.string().uuid().optional(),
  hashtags: HashtagsSchema.optional(),
  platformPostId: z.string().trim().min(1).optional(),
  postedAt: z.string().datetime().optional(),
});

export type PublishedPostInput = z.infer<typeof PublishedPostInputSchema>;
