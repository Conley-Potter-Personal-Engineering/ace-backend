import { createMocks } from "node-mocks-http";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/performance-metrics/posts/[id]";
import { getSupabase } from "@/db/supabase";

vi.mock("@/db/supabase", () => ({
  getSupabase: vi.fn(),
}));

type SupabaseMockConfig = {
  post: any;
  metrics: any[];
};

const buildSupabaseMock = ({ post, metrics }: SupabaseMockConfig) => ({
  from: vi.fn((table: string) => {
    if (table === "published_posts") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        returns: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(async () => ({ data: post, error: null })),
      };
    }
    if (table === "performance_metrics") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        returns: vi.fn(async () => ({ data: metrics, error: null })),
      };
    }
    throw new Error(`Unexpected table ${table}`);
  }),
});

const callHandler = async (options: {
  post?: any;
  metrics?: any[];
  id?: string;
  headers?: Record<string, string>;
}) => {
  const {
    post = {
      post_id: "post-1",
      platform: "tiktok",
      platform_post_id: "ext-post-1",
    },
    metrics = [],
    id = "2b1b26b9-5ef9-4f12-9d1e-8f24f4c4d9a0",
    headers = { "x-api-key": "test-key" },
  } = options;

  vi.mocked(getSupabase).mockReturnValue(buildSupabaseMock({ post, metrics }) as any);

  const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
    method: "GET",
    query: { id },
    headers,
  });

  await handler(req, res);

  return {
    status: res._getStatusCode(),
    body: JSON.parse(res._getData()),
  };
};

describe("GET /api/performance-metrics/posts/[id]", () => {
  beforeEach(() => {
    process.env.ACE_API_KEY = "test-key";
    vi.clearAllMocks();
  });

  it("returns 401 when API key is missing", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "GET",
      query: { id: "2b1b26b9-5ef9-4f12-9d1e-8f24f4c4d9a0" },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    const body = JSON.parse(res._getData());
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 404 when post is not found", async () => {
    const result = await callHandler({ post: null });

    expect(result.status).toBe(404);
    expect(result.body.error.code).toBe("NOT_FOUND");
  });

  it("returns empty metrics when none collected", async () => {
    const result = await callHandler({ metrics: [] });

    expect(result.status).toBe(200);
    expect(result.body.data.metrics).toEqual([]);
    expect(result.body.data.last_updated).toBeNull();
  });

  it("returns metrics for all standard types when present", async () => {
    const result = await callHandler({
      metrics: [
        {
          collected_at: "2024-01-01T00:00:00.000Z",
          view_count: 100,
          like_count: 10,
          comment_count: 5,
          share_count: 2,
          watch_time_ms: 900,
        },
      ],
    });

    const metricNames = result.body.data.metrics.map(
      (metric: any) => metric.metric_name,
    );
    expect(metricNames).toEqual([
      "comments",
      "likes",
      "shares",
      "views",
      "watch_time_avg",
    ]);
  });

  it("returns partial metrics when only some types are available", async () => {
    const result = await callHandler({
      metrics: [
        {
          collected_at: "2024-01-02T00:00:00.000Z",
          view_count: 50,
          like_count: 5,
          comment_count: null,
          share_count: null,
          watch_time_ms: null,
        },
      ],
    });

    const metricNames = result.body.data.metrics.map(
      (metric: any) => metric.metric_name,
    );
    expect(metricNames).toEqual(["likes", "views"]);
  });

  it("orders metrics by metric_name then collected_at", async () => {
    const result = await callHandler({
      metrics: [
        {
          collected_at: "2024-01-02T00:00:00.000Z",
          view_count: 20,
          like_count: 2,
          comment_count: null,
          share_count: null,
          watch_time_ms: null,
        },
        {
          collected_at: "2024-01-01T00:00:00.000Z",
          view_count: 10,
          like_count: 1,
          comment_count: null,
          share_count: null,
          watch_time_ms: null,
        },
      ],
    });

    const metrics = result.body.data.metrics;
    expect(metrics).toEqual([
      {
        metric_name: "likes",
        value: 1,
        collected_at: "2024-01-01T00:00:00.000Z",
      },
      {
        metric_name: "likes",
        value: 2,
        collected_at: "2024-01-02T00:00:00.000Z",
      },
      {
        metric_name: "views",
        value: 10,
        collected_at: "2024-01-01T00:00:00.000Z",
      },
      {
        metric_name: "views",
        value: 20,
        collected_at: "2024-01-02T00:00:00.000Z",
      },
    ]);
    expect(result.body.data.last_updated).toBe("2024-01-02T00:00:00.000Z");
  });
});
