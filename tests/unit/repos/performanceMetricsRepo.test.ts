import { beforeEach, describe, expect, it, vi } from "vitest";
import { logPerformanceMetric } from "../../../src/repos/performanceMetrics";

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

describe("performanceMetricsRepo.logPerformanceMetric", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs a performance metric with valid data", async () => {
    const payload = {
      view_count: 100,
    };
    Object.assign(__singleResponse, { data: payload, error: null });

    // Schema expects camelCase, repo takes snake_case.
    const input = {
      view_count: 100,
      viewCount: 100,
    } as any;

    const result = await logPerformanceMetric(input);

    expect(getSupabase().from).toHaveBeenCalledWith("performance_metrics");
    expect(result).toEqual(payload);
  });
});
