import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { integrationEnv } from "../setup";
import handler from "@/pages/api/performance-metrics";
import { getPerformanceMetricsApi } from "@/api/handlers/performanceMetricsHandler";
import { createProduct, deleteProduct } from "@/repos/products";
import { createExperiment, deleteExperiment } from "@/repos/experiments";
import { createPublishedPost, deletePublishedPost } from "@/repos/publishedPosts";
import { logPerformanceMetric, deletePerformanceMetric } from "@/repos/performanceMetrics";

const describeIf = integrationEnv.hasSupabaseCredentials ? describe : describe.skip;

const createMockResponse = () => {
  let statusCode = 0;
  let body: any;
  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (payload: any) => {
      body = payload;
      return res;
    },
  };

  return {
    res,
    getStatus: () => statusCode,
    getBody: () => body,
  };
};

describe("GET /api/performance-metrics (auth + validation)", () => {
  it("returns 401 when API key is missing", async () => {
    const { res, getStatus, getBody } = createMockResponse();
    await handler({ method: "GET", headers: {} }, res as any);

    expect(getStatus()).toBe(401);
    expect(getBody()?.error?.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 for missing required parameters", async () => {
    process.env.ACE_API_KEY = "test-key";
    const { res, getStatus, getBody } = createMockResponse();

    await handler(
      {
        method: "GET",
        headers: { "x-api-key": "test-key" },
        query: { end_date: "2024-01-01T00:00:00.000Z" },
      },
      res as any,
    );

    expect(getStatus()).toBe(400);
    expect(getBody()?.error?.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid platform", async () => {
    process.env.ACE_API_KEY = "test-key";
    const { res, getStatus, getBody } = createMockResponse();

    await handler(
      {
        method: "GET",
        headers: { "x-api-key": "test-key" },
        query: {
          start_date: "2024-01-01T00:00:00.000Z",
          end_date: "2024-01-02T00:00:00.000Z",
          platform: "myspace",
        },
      },
      res as any,
    );

    expect(getStatus()).toBe(400);
    expect(getBody()?.error?.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid UUID", async () => {
    process.env.ACE_API_KEY = "test-key";
    const { res, getStatus, getBody } = createMockResponse();

    await handler(
      {
        method: "GET",
        headers: { "x-api-key": "test-key" },
        query: {
          start_date: "2024-01-01T00:00:00.000Z",
          end_date: "2024-01-02T00:00:00.000Z",
          experiment_id: "not-a-uuid",
        },
      },
      res as any,
    );

    expect(getStatus()).toBe(400);
    expect(getBody()?.error?.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid granularity", async () => {
    process.env.ACE_API_KEY = "test-key";
    const { res, getStatus, getBody } = createMockResponse();

    await handler(
      {
        method: "GET",
        headers: { "x-api-key": "test-key" },
        query: {
          start_date: "2024-01-01T00:00:00.000Z",
          end_date: "2024-01-02T00:00:00.000Z",
          granularity: "month",
        },
      },
      res as any,
    );

    expect(getStatus()).toBe(400);
    expect(getBody()?.error?.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when end_date is before start_date", async () => {
    process.env.ACE_API_KEY = "test-key";
    const { res, getStatus, getBody } = createMockResponse();

    await handler(
      {
        method: "GET",
        headers: { "x-api-key": "test-key" },
        query: {
          start_date: "2024-01-02T00:00:00.000Z",
          end_date: "2024-01-01T00:00:00.000Z",
        },
      },
      res as any,
    );

    expect(getStatus()).toBe(400);
    expect(getBody()?.error?.code).toBe("VALIDATION_ERROR");
  });
});

describeIf("GET /api/performance-metrics (integration)", () => {
  const ids = {
    productA: randomUUID(),
    productB: randomUUID(),
    exp1: randomUUID(),
    exp2: randomUUID(),
    exp3: randomUUID(),
    post1: randomUUID(),
    post2: randomUUID(),
    post3: randomUUID(),
    post4: randomUUID(),
    post5: randomUUID(),
    post6: randomUUID(),
    metric1: randomUUID(),
    metric2: randomUUID(),
    metric3: randomUUID(),
    metric4: randomUUID(),
    metric5: randomUUID(),
    metric6: randomUUID(),
    metric7: randomUUID(),
  };

  beforeAll(async () => {
    await createProduct({
      product_id: ids.productA,
      name: "Product Alpha",
      source_platform: "tiktok",
      created_at: new Date().toISOString(),
    });

    await createProduct({
      product_id: ids.productB,
      name: "Product Beta",
      source_platform: "youtube",
      created_at: new Date().toISOString(),
    });

    await createExperiment({
      experiment_id: ids.exp1,
      product_id: ids.productA,
      created_at: new Date().toISOString(),
    });

    await createExperiment({
      experiment_id: ids.exp2,
      product_id: ids.productB,
      created_at: new Date().toISOString(),
    });

    await createExperiment({
      experiment_id: ids.exp3,
      product_id: ids.productA,
      created_at: new Date().toISOString(),
    });

    await createPublishedPost({
      post_id: ids.post1,
      experiment_id: ids.exp1,
      platform: "tiktok",
      platform_post_id: "ext-tiktok",
      posted_at: "2024-01-01T01:00:00.000Z",
      created_at: "2024-01-01T01:00:00.000Z",
    });

    await createPublishedPost({
      post_id: ids.post2,
      experiment_id: ids.exp1,
      platform: "instagram",
      platform_post_id: "ext-instagram",
      posted_at: "2024-01-01T02:00:00.000Z",
      created_at: "2024-01-01T02:00:00.000Z",
    });

    await createPublishedPost({
      post_id: ids.post3,
      experiment_id: ids.exp2,
      platform: "youtube",
      platform_post_id: "ext-youtube",
      posted_at: "2024-01-02T03:00:00.000Z",
      created_at: "2024-01-02T03:00:00.000Z",
    });

    await createPublishedPost({
      post_id: ids.post4,
      experiment_id: ids.exp2,
      platform: "facebook",
      platform_post_id: "ext-facebook",
      posted_at: "2024-01-03T04:00:00.000Z",
      created_at: "2024-01-03T04:00:00.000Z",
    });

    await createPublishedPost({
      post_id: ids.post5,
      experiment_id: ids.exp3,
      platform: "linkedin",
      platform_post_id: "ext-linkedin",
      posted_at: "2024-01-07T05:00:00.000Z",
      created_at: "2024-01-07T05:00:00.000Z",
    });

    await createPublishedPost({
      post_id: ids.post6,
      experiment_id: ids.exp3,
      platform: "x",
      platform_post_id: "ext-x",
      posted_at: "2024-01-07T06:00:00.000Z",
      created_at: "2024-01-07T06:00:00.000Z",
    });

    await logPerformanceMetric({
      metric_id: ids.metric1,
      post_id: ids.post1,
      view_count: 100,
      like_count: 10,
      comment_count: 5,
      share_count: 2,
      watch_time_ms: 1000,
      collected_at: "2024-01-01T01:00:00.000Z",
    });

    await logPerformanceMetric({
      metric_id: ids.metric2,
      post_id: ids.post2,
      view_count: 30,
      like_count: 3,
      comment_count: 1,
      share_count: 0,
      watch_time_ms: 300,
      collected_at: "2024-01-01T02:00:00.000Z",
    });

    await logPerformanceMetric({
      metric_id: ids.metric3,
      post_id: ids.post1,
      view_count: 50,
      like_count: 5,
      comment_count: 2,
      share_count: 1,
      watch_time_ms: 500,
      collected_at: "2024-01-02T01:00:00.000Z",
    });

    await logPerformanceMetric({
      metric_id: ids.metric4,
      post_id: ids.post3,
      view_count: 80,
      like_count: 8,
      comment_count: 4,
      share_count: 2,
      watch_time_ms: 800,
      collected_at: "2024-01-02T03:00:00.000Z",
    });

    await logPerformanceMetric({
      metric_id: ids.metric5,
      post_id: ids.post4,
      view_count: 20,
      like_count: 2,
      comment_count: 1,
      share_count: 1,
      watch_time_ms: 200,
      collected_at: "2024-01-03T04:00:00.000Z",
    });

    await logPerformanceMetric({
      metric_id: ids.metric6,
      post_id: ids.post5,
      view_count: 10,
      like_count: 1,
      comment_count: 0,
      share_count: 0,
      watch_time_ms: 100,
      collected_at: "2024-01-07T05:00:00.000Z",
    });

    await logPerformanceMetric({
      metric_id: ids.metric7,
      post_id: ids.post6,
      view_count: 5,
      like_count: 0,
      comment_count: 0,
      share_count: 1,
      watch_time_ms: 50,
      collected_at: "2024-01-07T06:00:00.000Z",
    });
  });

  afterAll(async () => {
    await deletePerformanceMetric(ids.metric1);
    await deletePerformanceMetric(ids.metric2);
    await deletePerformanceMetric(ids.metric3);
    await deletePerformanceMetric(ids.metric4);
    await deletePerformanceMetric(ids.metric5);
    await deletePerformanceMetric(ids.metric6);
    await deletePerformanceMetric(ids.metric7);

    await deletePublishedPost(ids.post1);
    await deletePublishedPost(ids.post2);
    await deletePublishedPost(ids.post3);
    await deletePublishedPost(ids.post4);
    await deletePublishedPost(ids.post5);
    await deletePublishedPost(ids.post6);

    await deleteExperiment(ids.exp1);
    await deleteExperiment(ids.exp2);
    await deleteExperiment(ids.exp3);

    await deleteProduct(ids.productA);
    await deleteProduct(ids.productB);
  });

  it("returns aggregated metrics with required parameters only", async () => {
    const result = await getPerformanceMetricsApi({
      start_date: "2024-01-01T00:00:00.000Z",
      end_date: "2024-01-07T23:59:59.000Z",
    });

    expect(result.summary.total_views).toBe(295);
    expect(result.summary.total_engagement).toBe(49);
    expect(result.summary.avg_watch_time).toBeCloseTo(2950 / 7, 5);
    expect(result.summary.top_performing_post?.post_id).toBe(ids.post1);
    expect(result.summary.top_performing_post?.platform).toBe("tiktok");
    expect(result.summary.top_performing_post?.score).toBe(108);
    expect(result.top_experiments[0].experiment_id).toBe(ids.exp1);
    expect(result.top_experiments[0].performance_score).toBeCloseTo(63, 5);
  });

  it("supports all optional parameters", async () => {
    const result = await getPerformanceMetricsApi({
      start_date: "2024-01-01T00:00:00.000Z",
      end_date: "2024-01-03T23:59:59.000Z",
      platform: "tiktok",
      experiment_id: ids.exp1,
      product_id: ids.productA,
      granularity: "hour",
    });

    expect(result.summary.total_views).toBe(150);
    expect(result.time_series).toHaveLength(72);
    expect(result.time_series[0].platform).toBe("tiktok");
  });

  it("filters by platform (including all)", async () => {
    const platformExpectations: Array<[string, number]> = [
      ["tiktok", 150],
      ["instagram", 30],
      ["youtube", 80],
      ["facebook", 20],
      ["linkedin", 10],
      ["x", 5],
    ];

    for (const [platform, totalViews] of platformExpectations) {
      const result = await getPerformanceMetricsApi({
        start_date: "2024-01-01T00:00:00.000Z",
        end_date: "2024-01-07T23:59:59.000Z",
        platform,
      });

      expect(result.summary.total_views).toBe(totalViews);
      expect(result.time_series[0].platform).toBe(platform);
    }

    const allResult = await getPerformanceMetricsApi({
      start_date: "2024-01-01T00:00:00.000Z",
      end_date: "2024-01-07T23:59:59.000Z",
      platform: "all",
    });

    expect(allResult.summary.total_views).toBe(295);
    expect(allResult.time_series[0]).not.toHaveProperty("platform");
  });

  it("filters by experiment_id and product_id", async () => {
    const experimentResult = await getPerformanceMetricsApi({
      start_date: "2024-01-01T00:00:00.000Z",
      end_date: "2024-01-07T23:59:59.000Z",
      experiment_id: ids.exp2,
    });

    expect(experimentResult.summary.total_views).toBe(100);
    expect(experimentResult.top_experiments).toHaveLength(1);

    const productResult = await getPerformanceMetricsApi({
      start_date: "2024-01-01T00:00:00.000Z",
      end_date: "2024-01-07T23:59:59.000Z",
      product_id: ids.productA,
    });

    expect(productResult.summary.total_views).toBe(195);
  });

  it("aggregates time series by day", async () => {
    const result = await getPerformanceMetricsApi({
      start_date: "2024-01-01T00:00:00.000Z",
      end_date: "2024-01-07T23:59:59.000Z",
      granularity: "day",
    });

    expect(result.time_series).toHaveLength(7);
    expect(result.time_series[0]).toMatchObject({
      date: "2024-01-01T00:00:00.000Z",
      views: 130,
      engagement: 21,
    });
    expect(result.time_series[3]).toMatchObject({
      date: "2024-01-04T00:00:00.000Z",
      views: 0,
      engagement: 0,
    });
    expect(result.time_series[6]).toMatchObject({
      date: "2024-01-07T00:00:00.000Z",
      views: 15,
      engagement: 2,
    });
  });

  it("aggregates time series by hour", async () => {
    const result = await getPerformanceMetricsApi({
      start_date: "2024-01-01T01:00:00.000Z",
      end_date: "2024-01-01T03:00:00.000Z",
      granularity: "hour",
    });

    expect(result.time_series).toHaveLength(3);
    expect(result.time_series[0]).toMatchObject({
      date: "2024-01-01T01:00:00.000Z",
      views: 100,
      engagement: 17,
    });
    expect(result.time_series[1]).toMatchObject({
      date: "2024-01-01T02:00:00.000Z",
      views: 30,
      engagement: 4,
    });
    expect(result.time_series[2]).toMatchObject({
      date: "2024-01-01T03:00:00.000Z",
      views: 0,
      engagement: 0,
    });
  });

  it("aggregates time series by week", async () => {
    const result = await getPerformanceMetricsApi({
      start_date: "2024-01-01T00:00:00.000Z",
      end_date: "2024-01-07T23:59:59.000Z",
      granularity: "week",
    });

    expect(result.time_series).toHaveLength(1);
    expect(result.time_series[0]).toMatchObject({
      date: "2024-01-01T00:00:00.000Z",
      views: 295,
      engagement: 49,
    });
  });

  it("returns zeroed aggregates when no metrics exist", async () => {
    const result = await getPerformanceMetricsApi({
      start_date: "2023-01-01T00:00:00.000Z",
      end_date: "2023-01-02T23:59:59.000Z",
      granularity: "day",
    });

    expect(result.summary.total_views).toBe(0);
    expect(result.summary.total_engagement).toBe(0);
    expect(result.summary.avg_watch_time).toBe(0);
    expect(result.summary.top_performing_post).toBeNull();
    expect(result.top_experiments).toHaveLength(0);
    expect(result.time_series).toHaveLength(2);
    expect(result.time_series[0].views).toBe(0);
  });
});
