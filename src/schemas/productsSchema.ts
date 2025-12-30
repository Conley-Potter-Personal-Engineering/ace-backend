import { z } from "zod";

const MetadataSchema = z.record(z.any());

export const ProductInputSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  sourcePlatform: z.string().trim().min(1, "Source platform is required"),
  category: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  affiliateLink: z.string().trim().url().optional(),
  imageUrl: z.string().trim().url().optional(),
  meta: MetadataSchema.optional(),
});

export type ProductInput = z.infer<typeof ProductInputSchema>;
