import type { Tables } from "@/db/types";
import { findMany as findScripts } from "@/repos/scripts";
import { findMany as findVideoAssets } from "@/repos/videoAssets";
import {
  findMany as findPublishedPosts,
  listPostsForExperimentIds,
} from "@/repos/publishedPosts";
import {
  findMany as findExperiments,
  listExperimentsForAssetIds,
  listExperimentsForScriptIds,
} from "@/repos/experiments";
import { listMetricsForPostIds } from "@/repos/performanceMetrics";
import {
  ScriptsListQuerySchema,
  VideosListQuerySchema,
  PostsListQuerySchema,
} from "@/schemas/apiSchemas";
import { buildPagination, paginate } from "@/lib/api/utils/pagination";
import { resolveSort, sortRecords } from "@/lib/api/utils/queryBuilder";

const toNumber = (value: number | null | undefined): number => value ?? 0;

const buildLatestMetricsByPost = (
  metrics: Array<{
    post_id: string | null;
    view_count: number | null;
    like_count: number | null;
    comment_count: number | null;
    share_count: number | null;
    watch_time_ms: number | null;
  }>,
) => {
  const latest = new Map<string, {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    watchTimeMs: number;
  }>();
  for (const metric of metrics) {
    if (!metric.post_id || latest.has(metric.post_id)) {
      continue;
    }
    latest.set(metric.post_id, {
      views: toNumber(metric.view_count),
      likes: toNumber(metric.like_count),
      comments: toNumber(metric.comment_count),
      shares: toNumber(metric.share_count),
      watchTimeMs: toNumber(metric.watch_time_ms),
    });
  }
  return latest;
};

/**
 * Lists script artifacts with filters and pagination.
 */
export const listScriptsApi = async (rawQuery: Record<string, string | undefined>) => {
  const parsed = ScriptsListQuerySchema.parse(rawQuery);
  const limit = parsed.limit ?? 50;
  const offset = parsed.offset ?? 0;

  const scripts = await findScripts({
    productId: parsed.product_id,
    startDate: parsed.start_date,
    endDate: parsed.end_date,
  });

  const experimentRows = await listExperimentsForScriptIds(
    scripts.map((script) => script.script_id),
  );

  const experimentCounts = experimentRows.reduce<Record<string, number>>(
    (acc, experiment) => {
      if (!experiment.script_id) {
        return acc;
      }
      acc[experiment.script_id] = (acc[experiment.script_id] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const filtered = scripts.filter((script) => {
    const count = experimentCounts[script.script_id] ?? 0;
    if (parsed.has_experiments === true && count === 0) {
      return false;
    }
    if (parsed.has_experiments === false && count > 0) {
      return false;
    }
    return true;
  });

  const mapped = filtered.map((script) => ({
    id: script.script_id,
    title: script.title ?? null,
    hook: script.hook ?? null,
    script_text: script.script_text,
    cta: script.cta ?? null,
    outline: script.outline ?? null,
    product_id: script.product_id ?? null,
    creative_variables: script.creative_variables ?? null,
    creative_pattern_id: script.creative_pattern_id ?? null,
    trend_snapshot_id: script.trend_reference ?? null,
    created_at: script.created_at ?? null,
    experiment_count: experimentCounts[script.script_id] ?? 0,
  }));

  const sortSpec = resolveSort(parsed.sort, {
    created_at_desc: { key: "created_at", ascending: false },
    created_at_asc: { key: "created_at", ascending: true },
    title_asc: { key: "title", ascending: true },
  }, "created_at_desc");

  const sorted = sortRecords(mapped, sortSpec);
  const paginated = paginate(sorted, limit, offset);

  return {
    data: paginated,
    pagination: buildPagination(sorted.length, limit, offset),
  };
};

const buildExperimentAssetMap = (experiments: Tables<"experiments">[]) => {
  return experiments.reduce<Record<string, string[]>>((acc, experiment) => {
    if (!experiment.asset_id) {
      return acc;
    }
    acc[experiment.asset_id] = acc[experiment.asset_id] ?? [];
    acc[experiment.asset_id].push(experiment.experiment_id);
    return acc;
  }, {});
};

/**
 * Lists video artifacts with filters and pagination.
 */
export const listVideosApi = async (rawQuery: Record<string, string | undefined>) => {
  const parsed = VideosListQuerySchema.parse(rawQuery);
  const limit = parsed.limit ?? 50;
  const offset = parsed.offset ?? 0;

  const scripts = parsed.product_id
    ? await findScripts({ productId: parsed.product_id })
    : [];
  const allowedScriptIds = new Set(scripts.map((script) => script.script_id));

  const assets = await findVideoAssets({
    startDate: parsed.start_date,
    endDate: parsed.end_date,
  });

  const filteredAssets = assets.filter((asset) => {
    if (parsed.product_id && (!asset.script_id || !allowedScriptIds.has(asset.script_id))) {
      return false;
    }
    return true;
  });

  const experiments = await listExperimentsForAssetIds(
    filteredAssets.map((asset) => asset.asset_id),
  );

  const experimentsByAsset = buildExperimentAssetMap(experiments);
  const experimentsForAssets = Object.values(experimentsByAsset).flat();
  const posts = await listPostsForExperimentIds(experimentsForAssets);

  const postCounts = posts.reduce<Record<string, number>>((acc, post) => {
    if (!post.experiment_id) {
      return acc;
    }
    acc[post.experiment_id] = (acc[post.experiment_id] ?? 0) + 1;
    return acc;
  }, {});

  const assetPostCounts = filteredAssets.reduce<Record<string, number>>(
    (acc, asset) => {
      const experimentIds = experimentsByAsset[asset.asset_id] ?? [];
      acc[asset.asset_id] = experimentIds.reduce(
        (sum, experimentId) => sum + (postCounts[experimentId] ?? 0),
        0,
      );
      return acc;
    },
    {},
  );

  const filteredByExperiment = filteredAssets.filter((asset) => {
    const experimentCount = experimentsByAsset[asset.asset_id]?.length ?? 0;
    if (parsed.has_experiments === true && experimentCount === 0) {
      return false;
    }
    if (parsed.has_experiments === false && experimentCount > 0) {
      return false;
    }
    return true;
  });

  const mapped = filteredByExperiment.map((asset) => ({
    id: asset.asset_id,
    script_id: asset.script_id ?? null,
    storage_url: asset.storage_path,
    thumbnail_url: asset.thumbnail_path ?? null,
    duration: asset.duration_seconds ?? null,
    tone: asset.tone ?? null,
    layout: asset.layout ?? null,
    style_tags: asset.style_tags ?? [],
    metadata: asset.metadata ?? null,
    created_at: asset.created_at ?? null,
    post_count: assetPostCounts[asset.asset_id] ?? 0,
  }));

  const sortSpec = resolveSort(parsed.sort, {
    created_at_desc: { key: "created_at", ascending: false },
    created_at_asc: { key: "created_at", ascending: true },
    title_asc: { key: "storage_url", ascending: true },
  }, "created_at_desc");

  const sorted = sortRecords(mapped, sortSpec);
  const paginated = paginate(sorted, limit, offset);

  return {
    data: paginated,
    pagination: buildPagination(sorted.length, limit, offset),
  };
};

/**
 * Lists published posts with filters and pagination.
 */
export const listPostsApi = async (rawQuery: Record<string, string | undefined>) => {
  const parsed = PostsListQuerySchema.parse(rawQuery);
  const limit = parsed.limit ?? 50;
  const offset = parsed.offset ?? 0;

  const experiments = parsed.product_id
    ? await findExperiments({ productId: parsed.product_id })
    : [];
  const allowedExperimentIds = new Set(
    experiments.map((experiment) => experiment.experiment_id),
  );

  const posts = await findPublishedPosts({
    experimentId: parsed.experiment_id,
    platform: parsed.platform,
    startDate: parsed.start_date,
    endDate: parsed.end_date,
  });

  const filtered = posts.filter((post) => {
    if (parsed.product_id && (!post.experiment_id || !allowedExperimentIds.has(post.experiment_id))) {
      return false;
    }
    if (parsed.has_experiments === true && !post.experiment_id) {
      return false;
    }
    if (parsed.has_experiments === false && post.experiment_id) {
      return false;
    }
    return true;
  });

  const sortSpec = resolveSort(parsed.sort, {
    created_at_desc: { key: "created_at", ascending: false },
    created_at_asc: { key: "created_at", ascending: true },
    title_asc: { key: "platform_post_id", ascending: true },
  }, "created_at_desc");

  const sortedPosts = sortRecords(filtered, sortSpec);
  const paginatedPosts = paginate(sortedPosts, limit, offset);

  const metrics = await listMetricsForPostIds(paginatedPosts.map((post) => post.post_id));
  const latestMetricsByPost = buildLatestMetricsByPost(metrics);

  const mapped = paginatedPosts.map((post) => {
    const metric = latestMetricsByPost.get(post.post_id);
    const views = metric?.views ?? 0;
    const engagement = (metric?.likes ?? 0) + (metric?.comments ?? 0) + (metric?.shares ?? 0);
    const engagementRate = views > 0 ? engagement / views : 0;

    return {
      id: post.post_id,
      experiment_id: post.experiment_id ?? null,
      platform: post.platform,
      external_post_id: post.platform_post_id ?? null,
      published_at: post.posted_at ?? null,
      performance_summary: {
        views,
        engagement_rate: engagementRate,
        avg_watch_time: metric?.watchTimeMs ?? 0,
      },
      workflow_id: post.workflow_id ?? null,
      correlation_id: post.correlation_id ?? null,
    };
  });

  return {
    data: mapped,
    pagination: buildPagination(sortedPosts.length, limit, offset),
  };
};
