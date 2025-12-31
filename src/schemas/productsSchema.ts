import { z } from "zod";

export const ProductMetaSchema = z
  .object({
    key_features: z.array(z.string()).optional(),
    objections: z.array(z.string()).optional(),
    demo_ideas: z.array(z.string()).optional(),
    compliance: z.array(z.string()).optional(),
  })
  .nullable();

export const ProductSchema = z.object({
  product_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  image_url: z.string().url().nullable(),
  affiliate_link: z.string().url().nullable(),
  source_platform: z.string(),
  category: z.string().nullable(),
  meta: ProductMetaSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ProductInputSchema = ProductSchema;

export type Product = z.infer<typeof ProductSchema>;
export type ProductInput = z.infer<typeof ProductInputSchema>;
