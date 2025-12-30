import { describe, expect, it } from "vitest";
import { ProductInputSchema } from "../../../src/schemas/productsSchema";

describe("productsSchema", () => {
  it("parses valid input", () => {
    const input = {
      name: "Test Product",
      sourcePlatform: "Shopify",
      category: "Electronics",
    };
    const result = ProductInputSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("requires name and sourcePlatform", () => {
    expect(() => ProductInputSchema.parse({})).toThrow();
  });

  it("validates URLs", () => {
    const input = {
      name: "Test",
      sourcePlatform: "Test",
      affiliateLink: "not-a-url",
    };
    expect(() => ProductInputSchema.parse(input)).toThrow();
  });
});
