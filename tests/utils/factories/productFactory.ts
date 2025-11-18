import { randomUUID } from "crypto";
import type { Tables } from "../../../src/db/types";

export const buildProduct = (
  overrides: Partial<Tables<"products">> = {},
): Tables<"products"> => ({
  product_id: randomUUID(),
  name: "Test Product",
  description: "A product used for testing the scriptwriter agent",
  source_platform: "integration",
  category: "testing",
  affiliate_link: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  image_url: null,
  meta: null,
  ...overrides,
});
