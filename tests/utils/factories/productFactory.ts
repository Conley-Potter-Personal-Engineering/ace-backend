import { randomUUID } from "crypto";
import type { Tables } from "../../../src/db/types";

export const buildProduct = (
  overrides: Partial<Tables<"products">> = {},
): Tables<"products"> => ({
  product_id: randomUUID(),
  name: "Test Product",
  description: "A product used for testing the scriptwriter agent",
  brand: "TestBrand",
  source_platform: "integration",
  category: "testing",
  price_usd: 29.99,
  currency: "USD",
  target_audience: "Health-conscious adults",
  primary_benefit: "Saves time",
  content_brief: "Focus on convenience angle",
  status: "active",
  affiliate_link: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  image_url: null,
  key_features: ["feature1", "feature2"],
  objections: ["objection1"],
  demo_ideas: ["demo1"],
  meta: { compliance: ["No medical claims"] },
  ...overrides,
});
