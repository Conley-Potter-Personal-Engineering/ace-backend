import { describe, expect, it } from "vitest";
import { ProductInputSchema } from "../../../src/schemas/productsSchema";

describe("productsSchema", () => {
  it("parses valid input", () => {
    const input = {
      product_id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Test Product",
      description: "Test description",
      brand: "TestBrand",
      category: "Electronics",
      price_usd: 29.99,
      currency: "USD",
      target_audience: "Health-conscious adults",
      primary_benefit: "Saves time",
      content_brief: "Focus on convenience angle",
      status: "active",
      image_url: null,
      affiliate_link: null,
      source_platform: "Shopify",
      key_features: ["feature1", "feature2"],
      objections: ["objection1"],
      demo_ideas: ["demo1"],
      meta: { compliance: ["No medical claims"] },
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
      brand: "TestBrand",
      category: "Electronics",
      price_usd: 29.99,
      currency: "USD",
      target_audience: "Health-conscious adults",
      primary_benefit: "Saves time",
      content_brief: "Focus on convenience angle",
      status: "active",
      image_url: "not-a-url",
      affiliate_link: "not-a-url",
      source_platform: "Test",
      key_features: [],
      objections: [],
      demo_ideas: [],
      meta: { compliance: [] },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(() => ProductInputSchema.parse(input)).toThrow();
  });
});
