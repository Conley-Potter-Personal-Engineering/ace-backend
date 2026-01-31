import { z } from "zod";

export const ProductSchema = z.object({
  product_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  brand: z.string().nullable(),
  category: z.string().nullable(),
  price_usd: z.number().nullable(),
  currency: z.string().default("USD"),
  target_audience: z.string().nullable(),
  primary_benefit: z.string().nullable(),
  content_brief: z.string().nullable(),
  status: z.enum(["active", "draft", "archived"]).default("draft"),
  image_url: z.string().url().nullable(),
  affiliate_link: z.string().url().nullable(),
  source_platform: z.string(),
  
  // JSON array columns (already exist)
  key_features: z.array(z.string()).default([]),
  objections: z.array(z.string()).default([]),
  demo_ideas: z.array(z.string()).default([]),
  
  // Catch-all for edge cases
  meta: z.object({
    compliance: z.array(z.string()).optional(),
  }).passthrough().nullable(),
  
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ProductInputSchema = ProductSchema;

export type Product = z.infer<typeof ProductSchema>;
export type ProductInput = z.infer<typeof ProductInputSchema>;
