import { describe, expect, it } from "vitest";
import { productInputSchema } from "../../../src/schemas/productsSchema";

describe("productsSchema", () => {
  it("parses valid input", () => {
    const input = {
      name: "Test Product",
      sourcePlatform: "Shopify",
      category: "Electronics",
    };
    const result = productInputSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("requires name and sourcePlatform", () => {
    expect(() => productInputSchema.parse({})).toThrow();
  });

  it("validates URLs", () => {
    const input = {
      name: "Test",
      sourcePlatform: "Test",
      affiliateLink: "not-a-url",
    };
    expect(() => productInputSchema.parse(input)).toThrow();
  });
});
