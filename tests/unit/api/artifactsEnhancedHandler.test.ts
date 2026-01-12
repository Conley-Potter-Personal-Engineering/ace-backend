import { describe, expect, it, vi } from "vitest";
import {
  listScriptsApi,
  listVideosApi,
  listPostsApi,
} from "@/api/handlers/artifactsEnhancedHandler";

vi.mock("@/repos/scripts", () => ({
  findMany: vi.fn(),
}));

vi.mock("@/repos/experiments", () => ({
  findMany: vi.fn(),
  listExperimentsForScriptIds: vi.fn(),
  listExperimentsForAssetIds: vi.fn(),
}));

vi.mock("@/repos/videoAssets", () => ({
  findMany: vi.fn(),
}));

vi.mock("@/repos/publishedPosts", () => ({
  findMany: vi.fn(),
  listPostsForExperimentIds: vi.fn(),
}));

vi.mock("@/repos/performanceMetrics", () => ({
  listMetricsForPostIds: vi.fn(),
}));

const scriptsRepo = await import("@/repos/scripts");
const experimentsRepo = await import("@/repos/experiments");
const videoAssetsRepo = await import("@/repos/videoAssets");
const postsRepo = await import("@/repos/publishedPosts");
const metricsRepo = await import("@/repos/performanceMetrics");

describe("artifactsEnhancedHandler", () => {
  it("lists scripts with experiment counts", async () => {
    vi.mocked(scriptsRepo.findMany).mockResolvedValue([
      {
        script_id: "script-1",
        title: "Script A",
        hook: "Hook",
        script_text: "Text",
        cta: null,
        outline: null,
        product_id: "prod-1",
        creative_variables: null,
        creative_pattern_id: null,
        trend_reference: null,
        created_at: "2024-01-01T00:00:00.000Z",
      },
    ] as any);

    vi.mocked(experimentsRepo.listExperimentsForScriptIds).mockResolvedValue([
      { experiment_id: "exp-1", script_id: "script-1" },
    ] as any);

    const result = await listScriptsApi({});
    expect(result.data).toHaveLength(1);
    expect(result.data[0].experiment_count).toBe(1);
  });

  it("lists videos with post counts", async () => {
    vi.mocked(videoAssetsRepo.findMany).mockResolvedValue([
      {
        asset_id: "asset-1",
        script_id: "script-1",
        storage_path: "s3://video.mp4",
        thumbnail_path: null,
        duration_seconds: 10,
        tone: "balanced",
        layout: "vertical",
        style_tags: ["tag"],
        metadata: null,
        created_at: "2024-01-02T00:00:00.000Z",
      },
    ] as any);

    vi.mocked(experimentsRepo.listExperimentsForAssetIds).mockResolvedValue([
      { experiment_id: "exp-1", asset_id: "asset-1" },
    ] as any);

    vi.mocked(postsRepo.listPostsForExperimentIds).mockResolvedValue([
      { post_id: "post-1", experiment_id: "exp-1" },
    ] as any);

    const result = await listVideosApi({});
    expect(result.data).toHaveLength(1);
    expect(result.data[0].post_count).toBe(1);
  });

  it("lists posts with performance summaries", async () => {
    vi.mocked(postsRepo.findMany).mockResolvedValue([
      {
        post_id: "post-1",
        experiment_id: "exp-1",
        platform: "tiktok",
        platform_post_id: "ext",
        posted_at: "2024-01-03T00:00:00.000Z",
        created_at: "2024-01-03T00:00:00.000Z",
        workflow_id: "wf-1",
        correlation_id: "corr-1",
      },
    ] as any);

    vi.mocked(metricsRepo.listMetricsForPostIds).mockResolvedValue([
      {
        post_id: "post-1",
        view_count: 100,
        like_count: 10,
        comment_count: 5,
        share_count: 2,
        watch_time_ms: 3000,
      },
    ] as any);

    const result = await listPostsApi({});
    expect(result.data).toHaveLength(1);
    expect(result.data[0].performance_summary.views).toBe(100);
  });

  it("rejects invalid pagination", async () => {
    await expect(listScriptsApi({ limit: "0" })).rejects.toThrow();
  });
});
