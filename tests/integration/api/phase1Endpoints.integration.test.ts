import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { integrationEnv } from "../setup";
import {
  createProduct,
  deleteProduct,
} from "@/repos/products";
import {
  createScript,
  deleteScript,
} from "@/repos/scripts";
import {
  createVideoAsset,
  deleteVideoAsset,
} from "@/repos/videoAssets";
import {
  createExperiment,
  deleteExperiment,
} from "@/repos/experiments";
import {
  createPublishedPost,
  deletePublishedPost,
} from "@/repos/publishedPosts";
import {
  logPerformanceMetric,
  deletePerformanceMetric,
} from "@/repos/performanceMetrics";
import {
  listExperimentsApi,
  getExperimentDetailApi,
} from "@/api/handlers/experimentsHandler";
import {
  listScriptsApi,
  listVideosApi,
  listPostsApi,
} from "@/api/handlers/artifactsEnhancedHandler";

const describeIf = integrationEnv.hasSupabaseCredentials ? describe : describe.skip;

describeIf("Phase 1 API handlers (integration)", () => {
  const ids = {
    productId: randomUUID(),
    scriptId: randomUUID(),
    assetId: randomUUID(),
    experimentId: randomUUID(),
    postId: randomUUID(),
    metricId: randomUUID(),
  };

  beforeAll(async () => {
    await createProduct({
      product_id: ids.productId,
      name: "Integration Product",
      source_platform: "tiktok",
      created_at: new Date().toISOString(),
    });

    await createScript({
      scriptId: ids.scriptId,
      productId: ids.productId,
      title: "Integration Script",
      scriptText: "Script text",
      hook: "Hook",
      cta: "CTA",
      outline: "Outline",
      creativeVariables: { emotion: "bold", structure: "list", style: "punchy" },
      createdAt: new Date().toISOString(),
    });

    await createVideoAsset({
      asset_id: ids.assetId,
      script_id: ids.scriptId,
      storage_path: "videos/integration.mp4",
      thumbnail_path: null,
      duration_seconds: 12,
      tone: "balanced",
      layout: "vertical",
      style_tags: ["tag"],
      metadata: { source: "integration" },
      created_at: new Date().toISOString(),
    });

    await createExperiment({
      experiment_id: ids.experimentId,
      product_id: ids.productId,
      script_id: ids.scriptId,
      asset_id: ids.assetId,
      created_at: new Date().toISOString(),
    });

    await createPublishedPost({
      post_id: ids.postId,
      experiment_id: ids.experimentId,
      platform: "tiktok",
      platform_post_id: "ext-1",
      posted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    await logPerformanceMetric({
      metric_id: ids.metricId,
      post_id: ids.postId,
      view_count: 100,
      like_count: 10,
      comment_count: 5,
      share_count: 2,
      watch_time_ms: 4000,
      collected_at: new Date().toISOString(),
    });
  });

  afterAll(async () => {
    await deletePerformanceMetric(ids.metricId);
    await deletePublishedPost(ids.postId);
    await deleteExperiment(ids.experimentId);
    await deleteVideoAsset(ids.assetId);
    await deleteScript(ids.scriptId);
    await deleteProduct(ids.productId);
  });

  it("returns experiment list and detail", async () => {
    const list = await listExperimentsApi({ product_id: ids.productId });
    expect(list.data.length).toBeGreaterThan(0);
    expect(list.pagination.total).toBeGreaterThan(0);

    const detail = await getExperimentDetailApi(ids.experimentId);
    expect(detail).not.toBeNull();
    expect(detail?.product?.id).toBe(ids.productId);
  });

  it("returns scripts, videos, and posts lists", async () => {
    const scripts = await listScriptsApi({ product_id: ids.productId });
    expect(scripts.data.length).toBeGreaterThan(0);

    const videos = await listVideosApi({ product_id: ids.productId });
    expect(videos.data.length).toBeGreaterThan(0);

    const posts = await listPostsApi({ product_id: ids.productId });
    expect(posts.data.length).toBeGreaterThan(0);
  });
});
