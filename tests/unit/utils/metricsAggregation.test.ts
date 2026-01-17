import { describe, expect, it } from "vitest";
import type { Tables } from "@/db/types";
import type { ExperimentWithProduct } from "@/lib/api/repositories/performanceMetricsRepository";
import {
  calculateEngagement,
  calculatePerformanceScore,
  groupMetricsByTimeBucket,
  rankExperimentsByScore,
} from "@/lib/api/utils/metricsAggregation";

const buildMetric = (
  overrides: Partial<Tables<"performance_metrics">> = {},
): Tables<"performance_metrics"> => ({
  metric_id: "metric-1",
  post_id: "post-1",
  collected_at: "2024-01-01T00:00:00.000Z",
  view_count: 0,
  like_count: 0,
  comment_count: 0,
  share_count: 0,
  watch_time_ms: 0,
  completion_rate: null,
  ...overrides,
});

describe("metricsAggregation utilities", () => {
  it("calculates engagement from denormalized columns", () => {
    const metric = buildMetric({ like_count: 2, comment_count: 3, share_count: 4 });
    expect(calculateEngagement(metric)).toBe(9);
  });

  it("treats null engagement values as zero", () => {
    const metric = buildMetric({ like_count: null, comment_count: null, share_count: null });
    expect(calculateEngagement(metric)).toBe(0);
  });

  it("calculates performance score using the weighted formula", () => {
    const metric = buildMetric({ view_count: 100, like_count: 10, comment_count: 5, share_count: 2 });
    expect(calculatePerformanceScore(metric)).toBe(73);
  });

  it("treats null performance values as zero", () => {
    const metric = buildMetric({ view_count: null, like_count: null, comment_count: null, share_count: null });
    expect(calculatePerformanceScore(metric)).toBe(0);
  });

  it("groups metrics by hour and fills gaps", () => {
    const metrics = [
      buildMetric({ collected_at: "2024-01-01T10:15:00.000Z", view_count: 5, like_count: 1, comment_count: 1, share_count: 0 }),
      buildMetric({ collected_at: "2024-01-01T10:45:00.000Z", view_count: 3, like_count: 0, comment_count: 1, share_count: 1 }),
      buildMetric({ collected_at: "2024-01-01T11:05:00.000Z", view_count: 2, like_count: 1, comment_count: 0, share_count: 0 }),
    ];

    const buckets = groupMetricsByTimeBucket(
      metrics,
      "hour",
      "2024-01-01T10:00:00.000Z",
      "2024-01-01T12:00:00.000Z",
    );

    expect(buckets).toHaveLength(3);
    expect(buckets[0]).toEqual({
      date: "2024-01-01T10:00:00.000Z",
      views: 8,
      engagement: 4,
    });
    expect(buckets[1]).toEqual({
      date: "2024-01-01T11:00:00.000Z",
      views: 2,
      engagement: 1,
    });
    expect(buckets[2]).toEqual({
      date: "2024-01-01T12:00:00.000Z",
      views: 0,
      engagement: 0,
    });
  });

  it("groups metrics by day with sparse data", () => {
    const metrics = [
      buildMetric({ collected_at: "2024-01-01T09:00:00.000Z", view_count: 10 }),
      buildMetric({ collected_at: "2024-01-03T21:00:00.000Z", view_count: 5, like_count: 1 }),
    ];

    const buckets = groupMetricsByTimeBucket(
      metrics,
      "day",
      "2024-01-01T00:00:00.000Z",
      "2024-01-03T23:59:59.000Z",
    );

    expect(buckets).toHaveLength(3);
    expect(buckets[0].views).toBe(10);
    expect(buckets[1].views).toBe(0);
    expect(buckets[2].views).toBe(5);
  });

  it("groups metrics by week using Monday boundaries", () => {
    const metrics = [
      buildMetric({ collected_at: "2024-01-02T12:00:00.000Z", view_count: 7 }),
      buildMetric({ collected_at: "2024-01-09T12:00:00.000Z", view_count: 3 }),
    ];

    const buckets = groupMetricsByTimeBucket(
      metrics,
      "week",
      "2024-01-02T00:00:00.000Z",
      "2024-01-10T23:59:59.000Z",
    );

    expect(buckets.map((bucket) => bucket.date)).toEqual([
      "2024-01-01T00:00:00.000Z",
      "2024-01-08T00:00:00.000Z",
    ]);
    expect(buckets[0].views).toBe(7);
    expect(buckets[1].views).toBe(3);
  });

  it("returns zero-filled buckets when metrics are empty", () => {
    const buckets = groupMetricsByTimeBucket(
      [],
      "day",
      "2024-01-01T00:00:00.000Z",
      "2024-01-02T23:59:59.000Z",
    );

    expect(buckets).toHaveLength(2);
    expect(buckets[0].views).toBe(0);
    expect(buckets[1].engagement).toBe(0);
  });

  it("ranks experiments by average score", () => {
    const experiments: ExperimentWithProduct[] = [
      {
        post_id: "post-1",
        experiment_id: "exp-1",
        product_name: "Widget",
        platform: "tiktok",
      },
      {
        post_id: "post-2",
        experiment_id: "exp-1",
        product_name: "Widget",
        platform: "tiktok",
      },
      {
        post_id: "post-3",
        experiment_id: "exp-2",
        product_name: "Gizmo",
        platform: "youtube",
      },
    ];

    const metrics = [
      buildMetric({ post_id: "post-1", view_count: 100, like_count: 10, comment_count: 0, share_count: 0 }),
      buildMetric({ post_id: "post-2", view_count: 10, like_count: 0, comment_count: 0, share_count: 0 }),
      buildMetric({ post_id: "post-3", view_count: 20, like_count: 5, comment_count: 5, share_count: 0 }),
    ];

    const ranked = rankExperimentsByScore(experiments, metrics);

    expect(ranked).toHaveLength(2);
    expect(ranked[0].experiment_id).toBe("exp-2");
    expect(ranked[0].platform).toBe("youtube");
    expect(ranked[0].performance_score).toBe(31);
    expect(ranked[1].experiment_id).toBe("exp-1");
    expect(ranked[1].performance_score).toBeCloseTo(26.5, 5);
  });

  it("returns an empty ranking when inputs are empty", () => {
    const ranked = rankExperimentsByScore([], []);
    expect(ranked).toHaveLength(0);
  });
});
