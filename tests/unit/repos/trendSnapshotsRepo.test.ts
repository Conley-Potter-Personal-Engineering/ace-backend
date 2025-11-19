import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTrendSnapshot } from "../../../src/repos/trendSnapshots";

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

describe("trendSnapshotsRepo.createTrendSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a trend snapshot with valid data", async () => {
    const payload = {
      product_id: "123e4567-e89b-12d3-a456-426614174000",
      competition_score: 50,
    };
    Object.assign(__singleResponse, { data: payload, error: null });

    // Schema expects camelCase, repo takes snake_case.
    // Passing both to satisfy test runtime.
    const input = {
      product_id: "123e4567-e89b-12d3-a456-426614174000",
      productId: "123e4567-e89b-12d3-a456-426614174000",
      competition_score: 50,
      competitionScore: 50,
    } as any;

    const result = await createTrendSnapshot(input);

    expect(getSupabase().from).toHaveBeenCalledWith("trend_snapshots");
    expect(result).toEqual(payload);
  });
});
