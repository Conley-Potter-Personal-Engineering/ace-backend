import { describe, expect, it } from "vitest";
import { ProductInputSchema } from "../../../src/schemas/productsSchema";

describe("productsSchema", () => {
  it("parses valid input", () => {
    const input = {
      product_id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Test Product",
      description: "Test description",
      image_url: null,
      affiliate_link: null,
      source_platform: "Shopify",
      category: "Electronics",
      meta: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const result = ProductInputSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("requires name and sourcePlatform", () => {
    expect(() => ProductInputSchema.parse({})).toThrow();
  });

  it("validates URLs", () => {
    const input = {
      product_id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Test",
      description: "Test description",
      image_url: "not-a-url",
      affiliate_link: "not-a-url",
      source_platform: "Test",
      category: null,
      meta: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(() => ProductInputSchema.parse(input)).toThrow();
  });
});
