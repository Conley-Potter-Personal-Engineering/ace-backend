import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { integrationEnv } from "../setup";
import { getPostPerformanceMetricsApi } from "@/api/handlers/performanceMetricsHandler";
import { createProduct, deleteProduct } from "@/repos/products";
import { createExperiment, deleteExperiment } from "@/repos/experiments";
import { createPublishedPost, deletePublishedPost } from "@/repos/publishedPosts";
import { deletePerformanceMetric, logPerformanceMetric } from "@/repos/performanceMetrics";

const describeIf = integrationEnv.hasSupabaseCredentials ? describe : describe.skip;

describeIf("GET /api/performance-metrics/posts/[id] (integration)", () => {
  const ids = {
    product: randomUUID(),
    experiment: randomUUID(),
    postA: randomUUID(),
    postB: randomUUID(),
    postC: randomUUID(),
    metricA1: randomUUID(),
    metricA2: randomUUID(),
    metricA3: randomUUID(),
    metricB1: randomUUID(),
  };

  beforeAll(async () => {
    await createProduct({
      product_id: ids.product,
      name: "Metrics Product",
      source_platform: "tiktok",
      created_at: new Date().toISOString(),
    });

    await createExperiment({
      experiment_id: ids.experiment,
      product_id: ids.product,
      created_at: new Date().toISOString(),
    });

    await createPublishedPost({
      post_id: ids.postA,
      experiment_id: ids.experiment,
      platform: "tiktok",
      platform_post_id: "ext-post-a",
      posted_at: "2024-01-01T00:00:00.000Z",
      created_at: "2024-01-01T00:00:00.000Z",
    });

    await createPublishedPost({
      post_id: ids.postB,
      experiment_id: ids.experiment,
      platform: "instagram",
      platform_post_id: "ext-post-b",
      posted_at: "2024-01-02T00:00:00.000Z",
      created_at: "2024-01-02T00:00:00.000Z",
    });

    await createPublishedPost({
      post_id: ids.postC,
      experiment_id: ids.experiment,
      platform: "youtube",
      platform_post_id: "ext-post-c",
      posted_at: "2024-01-03T00:00:00.000Z",
      created_at: "2024-01-03T00:00:00.000Z",
    });

    await logPerformanceMetric({
      metric_id: ids.metricA1,
      post_id: ids.postA,
      view_count: 100,
      like_count: 10,
      comment_count: 5,
      share_count: 2,
      watch_time_ms: 1000,
      collected_at: "2024-01-01T10:00:00.000Z",
    });

    await logPerformanceMetric({
      metric_id: ids.metricA2,
      post_id: ids.postA,
      view_count: 150,
      like_count: 15,
      comment_count: 7,
      share_count: 3,
      watch_time_ms: 1200,
      collected_at: "2024-01-02T10:00:00.000Z",
    });

    await logPerformanceMetric({
      metric_id: ids.metricA3,
      post_id: ids.postA,
      view_count: 200,
      like_count: 20,
      comment_count: 8,
      share_count: 4,
      watch_time_ms: 1400,
      collected_at: "2024-01-03T10:00:00.000Z",
    });

    await logPerformanceMetric({
      metric_id: ids.metricB1,
      post_id: ids.postB,
      view_count: 80,
      like_count: 8,
      comment_count: null,
      share_count: null,
      watch_time_ms: null,
      collected_at: "2024-01-02T12:00:00.000Z",
    });
  });

  afterAll(async () => {
    await deletePerformanceMetric(ids.metricA1);
    await deletePerformanceMetric(ids.metricA2);
    await deletePerformanceMetric(ids.metricA3);
    await deletePerformanceMetric(ids.metricB1);

    await deletePublishedPost(ids.postA);
    await deletePublishedPost(ids.postB);
    await deletePublishedPost(ids.postC);

    await deleteExperiment(ids.experiment);
    await deleteProduct(ids.product);
  });

  it("returns all metrics for post A in order with last_updated", async () => {
    const result = await getPostPerformanceMetricsApi(ids.postA);

    expect(result).not.toBeNull();
    expect(result?.post_id).toBe(ids.postA);
    expect(result?.last_updated).toBe("2024-01-03T10:00:00.000Z");

    expect(result?.metrics).toEqual([
      { metric_name: "comments", value: 5, collected_at: "2024-01-01T10:00:00.000Z" },
      { metric_name: "comments", value: 7, collected_at: "2024-01-02T10:00:00.000Z" },
      { metric_name: "comments", value: 8, collected_at: "2024-01-03T10:00:00.000Z" },
      { metric_name: "likes", value: 10, collected_at: "2024-01-01T10:00:00.000Z" },
      { metric_name: "likes", value: 15, collected_at: "2024-01-02T10:00:00.000Z" },
      { metric_name: "likes", value: 20, collected_at: "2024-01-03T10:00:00.000Z" },
      { metric_name: "shares", value: 2, collected_at: "2024-01-01T10:00:00.000Z" },
      { metric_name: "shares", value: 3, collected_at: "2024-01-02T10:00:00.000Z" },
      { metric_name: "shares", value: 4, collected_at: "2024-01-03T10:00:00.000Z" },
      { metric_name: "views", value: 100, collected_at: "2024-01-01T10:00:00.000Z" },
      { metric_name: "views", value: 150, collected_at: "2024-01-02T10:00:00.000Z" },
      { metric_name: "views", value: 200, collected_at: "2024-01-03T10:00:00.000Z" },
      { metric_name: "watch_time_avg", value: 1000, collected_at: "2024-01-01T10:00:00.000Z" },
      { metric_name: "watch_time_avg", value: 1200, collected_at: "2024-01-02T10:00:00.000Z" },
      { metric_name: "watch_time_avg", value: 1400, collected_at: "2024-01-03T10:00:00.000Z" },
    ]);
  });

  it("returns only available metrics for post B", async () => {
    const result = await getPostPerformanceMetricsApi(ids.postB);

    expect(result).not.toBeNull();
    expect(result?.metrics).toEqual([
      { metric_name: "likes", value: 8, collected_at: "2024-01-02T12:00:00.000Z" },
      { metric_name: "views", value: 80, collected_at: "2024-01-02T12:00:00.000Z" },
    ]);
  });

  it("returns empty metrics for post C", async () => {
    const result = await getPostPerformanceMetricsApi(ids.postC);

    expect(result).not.toBeNull();
    expect(result?.metrics).toEqual([]);
    expect(result?.last_updated).toBeNull();
  });
});
