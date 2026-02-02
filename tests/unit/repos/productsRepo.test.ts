import { beforeEach, describe, expect, it, vi } from "vitest";
import { createProduct } from "../../../src/repos/products";

const { getSupabase, __singleResponse } = vi.hoisted(() => {
  const singleResponse = { data: null, error: null };
  const from = vi.fn(() => ({
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    returns: vi.fn().mockReturnThis(),
    single: vi.fn(async () => singleResponse),
    maybeSingle: vi.fn(async () => singleResponse),
  }));
  const getSupabase = vi.fn(() => ({ from }));
  return { getSupabase, __singleResponse: singleResponse };
});

vi.mock("../../../src/db/db", () => ({
  getSupabase,
  __singleResponse,
}));

describe("productsRepo.createProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a product with valid data", async () => {
    const payload = {
      name: "Test Product",
      source_platform: "Shopify",
      brand: "TestBrand",
      category: "Electronics",
      price_usd: 29.99,
      currency: "USD",
      target_audience: "Health-conscious adults",
      primary_benefit: "Saves time",
      content_brief: "Focus on convenience angle",
      status: "active",
      key_features: ["feature1", "feature2"],
      objections: ["objection1"],
      demo_ideas: ["demo1"],
      meta: { compliance: ["No medical claims"] },
    };
    Object.assign(__singleResponse, { data: payload, error: null });

    const result = await createProduct(payload);

    expect(getSupabase().from).toHaveBeenCalledWith("products");
    expect(result).toEqual(payload);
  });
});
