import { describe, expect, it, vi } from "vitest";
import { listExperimentsApi, getExperimentDetailApi } from "@/api/handlers/experimentsHandler";

vi.mock("@/repos/experiments", () => ({
  findMany: vi.fn(),
  getExperimentById: vi.fn(),
}));

vi.mock("@/repos/products", () => ({
  getProductById: vi.fn(),
}));

vi.mock("@/repos/scripts", () => ({
  getScriptById: vi.fn(),
}));

vi.mock("@/repos/videoAssets", () => ({
  getVideoAssetById: vi.fn(),
}));

vi.mock("@/repos/publishedPosts", () => ({
  listPostsForExperiment: vi.fn(),
  listPostsForExperimentIds: vi.fn(),
}));

vi.mock("@/repos/performanceMetrics", () => ({
  listMetricsForPostIds: vi.fn(),
}));

vi.mock("@/repos/agentNotes", () => ({
  searchNotesByTopic: vi.fn(),
}));

const experimentsRepo = await import("@/repos/experiments");
const productsRepo = await import("@/repos/products");
const scriptsRepo = await import("@/repos/scripts");
const assetsRepo = await import("@/repos/videoAssets");
const postsRepo = await import("@/repos/publishedPosts");
const metricsRepo = await import("@/repos/performanceMetrics");
const notesRepo = await import("@/repos/agentNotes");

describe("experimentsHandler", () => {
  it("returns paginated summaries with default sorting", async () => {
    vi.mocked(experimentsRepo.findMany).mockResolvedValue([
      {
        experiment_id: "exp-1",
        product_id: "prod-1",
        script_id: "script-1",
        asset_id: "asset-1",
        created_at: "2024-01-02T00:00:00.000Z",
        products: { name: "Widget" },
        scripts: { title: "Script A" },
      },
      {
        experiment_id: "exp-2",
        product_id: "prod-2",
        script_id: "script-2",
        asset_id: "asset-2",
        created_at: "2024-01-01T00:00:00.000Z",
        products: { name: "Gizmo" },
        scripts: { title: "Script B" },
      },
    ]);

    vi.mocked(postsRepo.listPostsForExperimentIds).mockResolvedValue([
      { post_id: "post-1", experiment_id: "exp-1" },
    ] as any);

    vi.mocked(metricsRepo.listMetricsForPostIds).mockResolvedValue([
      {
        post_id: "post-1",
        view_count: 100,
        like_count: 10,
        comment_count: 5,
        share_count: 2,
        watch_time_ms: 5000,
      },
    ] as any);

    const result = await listExperimentsApi({});
    expect(result.data).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    expect(result.data[0].id).toBe("exp-1");
    expect(result.data[0].published_post_count).toBe(1);
    expect(result.data[0].avg_performance_score).toBeGreaterThan(0);
  });

  it("rejects invalid query parameters", async () => {
    await expect(listExperimentsApi({ limit: "0" })).rejects.toThrow();
  });

  it("filters by performance score", async () => {
    vi.mocked(experimentsRepo.findMany).mockResolvedValue([
      {
        experiment_id: "exp-1",
        product_id: "prod-1",
        script_id: "script-1",
        asset_id: "asset-1",
        created_at: "2024-01-02T00:00:00.000Z",
        products: { name: "Widget" },
        scripts: { title: "Script A" },
      },
    ]);

    vi.mocked(postsRepo.listPostsForExperimentIds).mockResolvedValue([
      { post_id: "post-1", experiment_id: "exp-1" },
    ] as any);

    vi.mocked(metricsRepo.listMetricsForPostIds).mockResolvedValue([
      {
        post_id: "post-1",
        view_count: 1,
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        watch_time_ms: 0,
      },
    ] as any);

    const result = await listExperimentsApi({ min_score: "50" });
    expect(result.data).toHaveLength(1);

    const empty = await listExperimentsApi({ min_score: "200" });
    expect(empty.data).toHaveLength(0);
  });

  it("returns null when experiment not found", async () => {
    vi.mocked(experimentsRepo.getExperimentById).mockResolvedValue(null);

    const result = await getExperimentDetailApi("d290f1ee-6c54-4b01-90e6-d701748f0851");
    expect(result).toBeNull();
  });

  it("returns experiment detail with performance summary", async () => {
    vi.mocked(experimentsRepo.getExperimentById).mockResolvedValue({
      experiment_id: "exp-1",
      product_id: "prod-1",
      script_id: "script-1",
      asset_id: "asset-1",
      created_at: "2024-01-03T00:00:00.000Z",
    } as any);

    vi.mocked(productsRepo.getProductById).mockResolvedValue({
      product_id: "prod-1",
      name: "Widget",
      description: "A widget",
    } as any);

    vi.mocked(scriptsRepo.getScriptById).mockResolvedValue({
      script_id: "script-1",
      title: "Script A",
      hook: "Hook",
      script_text: "Text",
      cta: "CTA",
      outline: "Outline",
      creative_variables: { tone: "bold" },
      creative_pattern_id: "pattern-1",
    } as any);

    vi.mocked(assetsRepo.getVideoAssetById).mockResolvedValue({
      asset_id: "asset-1",
      storage_path: "s3://video.mp4",
      thumbnail_path: null,
      duration_seconds: 12,
      tone: "balanced",
      layout: "vertical",
    } as any);

    vi.mocked(postsRepo.listPostsForExperiment).mockResolvedValue([
      { post_id: "post-1", experiment_id: "exp-1", platform: "tiktok", platform_post_id: "ext", posted_at: null },
    ] as any);

    vi.mocked(metricsRepo.listMetricsForPostIds).mockResolvedValue([
      { post_id: "post-1", view_count: 100, like_count: 10, comment_count: 5, share_count: 1, watch_time_ms: 4000, collected_at: "2024-01-04T00:00:00.000Z" },
    ] as any);

    vi.mocked(notesRepo.searchNotesByTopic).mockResolvedValue([
      { note_id: "note-1", agent_name: "Agent", topic: "exp-1", content: "Note", importance: 0.5, created_at: null },
    ] as any);

    const result = await getExperimentDetailApi("d290f1ee-6c54-4b01-90e6-d701748f0851");
    expect(result).not.toBeNull();
    expect(result?.performance_summary.total_views).toBe(100);
    expect(result?.creative_patterns_used).toEqual(["pattern-1"]);
  });
});
