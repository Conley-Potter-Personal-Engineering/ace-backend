import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { integrationEnv } from "../setup";
import handler from "@/pages/api/metrics/summary";
import { createProduct, deleteProduct } from "@/repos/products";
import { createScript, deleteScript } from "@/repos/scripts";
import { createVideoAsset, deleteVideoAsset } from "@/repos/videoAssets";
import { createPublishedPost, deletePublishedPost } from "@/repos/publishedPosts";
import { deletePerformanceMetric, logPerformanceMetric } from "@/repos/performanceMetrics";
import { deleteSystemEvent, logSystemEvent } from "@/repos/systemEvents";

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

describe("GET /api/metrics/summary (auth + validation)", () => {
  it("returns 401 when API key is missing", async () => {
    const { res, getStatus, getBody } = createMockResponse();
    await handler({ method: "GET", headers: {} }, res as any);

    expect(getStatus()).toBe(401);
    expect(getBody()?.error?.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 for invalid period", async () => {
    process.env.ACE_API_KEY = "test-key";
    const { res, getStatus, getBody } = createMockResponse();

    await handler(
      {
        method: "GET",
        headers: { "x-api-key": "test-key" },
        query: { period: "quarter" },
      },
      res as any,
    );

    expect(getStatus()).toBe(400);
    expect(getBody()?.error?.code).toBe("VALIDATION_ERROR");
  });
});

describeIf("GET /api/metrics/summary (integration)", () => {
  const ids = {
    product: randomUUID(),
    scriptCurrent: randomUUID(),
    scriptPrevious: randomUUID(),
    scriptOutside: randomUUID(),
    assetCurrent: randomUUID(),
    assetPrevious: randomUUID(),
    assetPrevious2: randomUUID(),
    postCurrent: randomUUID(),
    postPrevious: randomUUID(),
    metricCurrent1: randomUUID(),
    metricCurrent2: randomUUID(),
    metricPrevious: randomUUID(),
    eventCritical1: randomUUID(),
    eventCritical2: randomUUID(),
    eventError: randomUUID(),
    eventWorkflowStart: randomUUID(),
    eventWorkflowSuccess: randomUUID(),
    eventWorkflowError: randomUUID(),
  };

  const now = new Date("2024-02-15T12:00:00.000Z");

  beforeAll(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);

    await createProduct({
      product_id: ids.product,
      name: "Summary Product",
      source_platform: "tiktok",
      category: "testing",
      created_at: now.toISOString(),
    });

    await createScript({
      scriptId: ids.scriptCurrent,
      productId: ids.product,
      title: "Current Script",
      scriptText: "Script text",
      hook: "Hook",
      creativeVariables: {
        emotion: "excited",
        structure: "problem-solution",
        style: "short",
      },
      createdAt: "2024-02-15T01:00:00.000Z",
    });

    await createScript({
      scriptId: ids.scriptPrevious,
      productId: ids.product,
      title: "Previous Script",
      scriptText: "Script text",
      hook: "Hook",
      creativeVariables: {
        emotion: "calm",
        structure: "story",
        style: "short",
      },
      createdAt: "2024-02-14T01:00:00.000Z",
    });

    await createScript({
      scriptId: ids.scriptOutside,
      productId: ids.product,
      title: "Outside Script",
      scriptText: "Script text",
      hook: "Hook",
      creativeVariables: {
        emotion: "neutral",
        structure: "list",
        style: "short",
      },
      createdAt: "2024-02-14T13:00:00.000Z",
    });

    await createVideoAsset({
      asset_id: ids.assetCurrent,
      script_id: ids.scriptCurrent,
      storage_path: "s3://asset-current.mp4",
      created_at: "2024-02-15T02:00:00.000Z",
    });

    await createVideoAsset({
      asset_id: ids.assetPrevious,
      script_id: ids.scriptPrevious,
      storage_path: "s3://asset-prev.mp4",
      created_at: "2024-02-14T02:00:00.000Z",
    });

    await createVideoAsset({
      asset_id: ids.assetPrevious2,
      script_id: ids.scriptPrevious,
      storage_path: "s3://asset-prev-2.mp4",
      created_at: "2024-02-14T03:00:00.000Z",
    });

    await createPublishedPost({
      post_id: ids.postCurrent,
      platform: "tiktok",
      platform_post_id: "post-current",
      created_at: "2024-02-15T03:00:00.000Z",
      posted_at: "2024-02-15T03:00:00.000Z",
    });

    await createPublishedPost({
      post_id: ids.postPrevious,
      platform: "tiktok",
      platform_post_id: "post-prev",
      created_at: "2024-02-14T03:00:00.000Z",
      posted_at: "2024-02-14T03:00:00.000Z",
    });

    await logPerformanceMetric({
      metric_id: ids.metricCurrent1,
      post_id: ids.postCurrent,
      view_count: 100,
      like_count: 10,
      comment_count: 0,
      share_count: 0,
      collected_at: "2024-02-15T04:00:00.000Z",
    });

    await logPerformanceMetric({
      metric_id: ids.metricCurrent2,
      post_id: ids.postCurrent,
      view_count: 50,
      like_count: 5,
      comment_count: 0,
      share_count: 0,
      collected_at: "2024-02-15T05:00:00.000Z",
    });

    await logPerformanceMetric({
      metric_id: ids.metricPrevious,
      post_id: ids.postPrevious,
      view_count: 100,
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      collected_at: "2024-02-14T05:00:00.000Z",
    });

    await logSystemEvent({
      event_id: ids.eventCritical1,
      event_type: "system.error",
      severity: "critical",
      created_at: "2024-02-15T11:30:00.000Z",
    });

    await logSystemEvent({
      event_id: ids.eventCritical2,
      event_type: "system.error",
      severity: "critical",
      created_at: "2024-02-15T11:45:00.000Z",
    });

    await logSystemEvent({
      event_id: ids.eventError,
      event_type: "system.error",
      severity: "error",
      created_at: "2024-02-15T06:00:00.000Z",
    });

    await logSystemEvent({
      event_id: ids.eventWorkflowStart,
      event_type: "workflow.start",
      workflow_id: "workflow-active",
      severity: "info",
      created_at: "2024-02-15T10:00:00.000Z",
    });

    await logSystemEvent({
      event_id: ids.eventWorkflowSuccess,
      event_type: "workflow.success",
      workflow_id: "workflow-done",
      severity: "info",
      created_at: "2024-02-15T10:30:00.000Z",
    });

    await logSystemEvent({
      event_id: ids.eventWorkflowError,
      event_type: "workflow.error",
      workflow_id: "workflow-failed",
      severity: "info",
      created_at: "2024-02-15T11:00:00.000Z",
    });
  });

  afterAll(async () => {
    vi.useRealTimers();

    await deleteSystemEvent(ids.eventCritical1);
    await deleteSystemEvent(ids.eventCritical2);
    await deleteSystemEvent(ids.eventError);
    await deleteSystemEvent(ids.eventWorkflowStart);
    await deleteSystemEvent(ids.eventWorkflowSuccess);
    await deleteSystemEvent(ids.eventWorkflowError);

    await deletePerformanceMetric(ids.metricCurrent1);
    await deletePerformanceMetric(ids.metricCurrent2);
    await deletePerformanceMetric(ids.metricPrevious);

    await deletePublishedPost(ids.postCurrent);
    await deletePublishedPost(ids.postPrevious);

    await deleteVideoAsset(ids.assetCurrent);
    await deleteVideoAsset(ids.assetPrevious);
    await deleteVideoAsset(ids.assetPrevious2);

    await deleteScript(ids.scriptCurrent);
    await deleteScript(ids.scriptPrevious);
    await deleteScript(ids.scriptOutside);

    await deleteProduct(ids.product);
  });

  it("returns summary metrics for today", async () => {
    process.env.ACE_API_KEY = "test-key";
    const { res, getStatus, getBody } = createMockResponse();

    await handler(
      {
        method: "GET",
        headers: { "x-api-key": "test-key" },
        query: { period: "today" },
      },
      res as any,
    );

    expect(getStatus()).toBe(200);
    const data = getBody()?.data;

    expect(data?.scripts_generated).toEqual({
      today: 1,
      week: 1,
      trend: "stable",
    });

    expect(data?.assets_rendered).toEqual({
      today: 1,
      week: 2,
      trend: "down",
    });

    expect(data?.posts_published).toEqual({
      today: 1,
      week: 1,
      trend: "stable",
    });

    expect(data?.avg_performance_score?.current).toBeCloseTo(37.5, 5);
    expect(data?.avg_performance_score?.previous_period).toBe(30);
    expect(data?.avg_performance_score?.change_percent).toBeCloseTo(25, 5);

    expect(data?.system_health).toBe("degraded");
    expect(data?.active_workflows).toBe(1);
    expect(data?.recent_errors_24h).toBe(3);
  });
});
