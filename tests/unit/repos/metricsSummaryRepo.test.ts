import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchPerformanceMetricsBetween,
  fetchPublishedPostsCreatedBetween,
  fetchScriptsCreatedBetween,
  fetchSystemEvents,
  fetchVideoAssetsCreatedBetween,
} from "@/repos/metricsSummary";

const { getSupabase, __response } = vi.hoisted(() => {
  const response = { data: null, error: null };
  const query = {
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    returns: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
  };

  const from = vi.fn(() => query);
  const getSupabase = vi.fn(() => ({ from }));

  query.returns.mockImplementation(async () => response);

  return { getSupabase, __response: response };
});

vi.mock("@/db/db", () => ({
  getSupabase,
}));

describe("metricsSummaryRepo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __response.data = [];
    __response.error = null;
  });

  it("fetches scripts within a date range", async () => {
    const result = await fetchScriptsCreatedBetween("2024-01-01", "2024-01-02");
    expect(getSupabase().from).toHaveBeenCalledWith("scripts");
    expect(result).toEqual([]);
  });

  it("fetches video assets within a date range", async () => {
    const result = await fetchVideoAssetsCreatedBetween("2024-01-01", "2024-01-02");
    expect(getSupabase().from).toHaveBeenCalledWith("video_assets");
    expect(result).toEqual([]);
  });

  it("fetches published posts within a date range", async () => {
    const result = await fetchPublishedPostsCreatedBetween("2024-01-01", "2024-01-02");
    expect(getSupabase().from).toHaveBeenCalledWith("published_posts");
    expect(result).toEqual([]);
  });

  it("fetches performance metrics by collected_at range", async () => {
    const result = await fetchPerformanceMetricsBetween("2024-01-01", "2024-01-02");
    expect(getSupabase().from).toHaveBeenCalledWith("performance_metrics");
    expect(result).toEqual([]);
  });

  it("fetches system events with filters", async () => {
    const result = await fetchSystemEvents({
      startDate: "2024-01-01",
      endDate: "2024-01-02",
      severities: ["error"],
      eventTypeLike: "workflow",
    });

    expect(getSupabase().from).toHaveBeenCalledWith("system_events");
    expect(result).toEqual([]);
  });
});
