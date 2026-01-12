import { findMany as findExperiments, getExperimentById } from "@/repos/experiments";
import { getProductById } from "@/repos/products";
import { getScriptById } from "@/repos/scripts";
import { getVideoAssetById } from "@/repos/videoAssets";
import {
  listPostsForExperiment,
  listPostsForExperimentIds,
} from "@/repos/publishedPosts";
import { listMetricsForPostIds } from "@/repos/performanceMetrics";
import { searchNotesByTopic } from "@/repos/agentNotes";
import {
  ExperimentIdParamSchema,
  ExperimentsListQuerySchema,
} from "@/schemas/apiSchemas";
import { buildPagination, paginate } from "@/lib/api/utils/pagination";
import { resolveSort, sortRecords } from "@/lib/api/utils/queryBuilder";

interface ExperimentSummary {
  id: string;
  product_id: string | null;
  product_name: string | null;
  script_id: string | null;
  script_title: string | null;
  asset_id: string | null;
  published_post_count: number;
  avg_performance_score: number;
  created_at: string | null;
}

interface MetricTotals {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTimeMs: number;
}

const emptyTotals = (): MetricTotals => ({
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  watchTimeMs: 0,
});

const toNumber = (value: number | null | undefined): number => value ?? 0;

const calculateScore = (totals: MetricTotals): number =>
  totals.views * 0.3 +
  totals.likes * 2 +
  totals.comments * 3 +
  totals.shares * 4;

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
  const latest = new Map<string, MetricTotals>();
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

const aggregateTotals = (totals: MetricTotals[]): MetricTotals => {
  return totals.reduce((acc, current) => ({
    views: acc.views + current.views,
    likes: acc.likes + current.likes,
    comments: acc.comments + current.comments,
    shares: acc.shares + current.shares,
    watchTimeMs: acc.watchTimeMs + current.watchTimeMs,
  }), emptyTotals());
};

/**
 * Lists experiments with summary data, filters, and pagination.
 */
export const listExperimentsApi = async (
  rawQuery: Record<string, string | undefined>,
) => {
  const parsed = ExperimentsListQuerySchema.parse(rawQuery);
  const limit = parsed.limit ?? 50;
  const offset = parsed.offset ?? 0;

  const experiments = await findExperiments({
    productId: parsed.product_id,
    startDate: parsed.start_date,
    endDate: parsed.end_date,
  });

  const experimentIds = experiments.map((experiment) => experiment.experiment_id);
  const posts = await listPostsForExperimentIds(experimentIds);
  const postIds = posts.map((post) => post.post_id);
  const metrics = await listMetricsForPostIds(postIds);
  const latestMetricsByPost = buildLatestMetricsByPost(metrics);

  const postsByExperiment = new Map<string, string[]>();
  for (const post of posts) {
    if (!post.experiment_id) {
      continue;
    }
    const current = postsByExperiment.get(post.experiment_id) ?? [];
    current.push(post.post_id);
    postsByExperiment.set(post.experiment_id, current);
  }

  const summaries: ExperimentSummary[] = experiments.map((experiment) => {
    const experimentPostIds = postsByExperiment.get(experiment.experiment_id) ?? [];
    const postTotals = experimentPostIds
      .map((postId) => latestMetricsByPost.get(postId) ?? emptyTotals());

    const scores = postTotals.map(calculateScore);
    const avgScore = scores.length
      ? scores.reduce((sum, value) => sum + value, 0) / scores.length
      : 0;

    return {
      id: experiment.experiment_id,
      product_id: experiment.product_id ?? null,
      product_name: experiment.products?.name ?? null,
      script_id: experiment.script_id ?? null,
      script_title: experiment.scripts?.title ?? null,
      asset_id: experiment.asset_id ?? null,
      published_post_count: experimentPostIds.length,
      avg_performance_score: avgScore,
      created_at: experiment.created_at ?? null,
    };
  });

  const maxScore = summaries.reduce(
    (max, summary) => Math.max(max, summary.avg_performance_score),
    0,
  );

  const normalized = summaries.map((summary) => ({
    ...summary,
    avg_performance_score:
      maxScore > 0 ? (summary.avg_performance_score / maxScore) * 100 : 0,
  }));

  const filtered = normalized.filter((summary) => {
    if (parsed.has_performance === true && summary.published_post_count === 0) {
      return false;
    }
    if (parsed.has_performance === false && summary.published_post_count > 0) {
      return false;
    }
    if (parsed.min_score !== undefined && summary.avg_performance_score < parsed.min_score) {
      return false;
    }
    if (parsed.max_score !== undefined && summary.avg_performance_score > parsed.max_score) {
      return false;
    }
    return true;
  });

  const sortSpec = resolveSort(parsed.sort, {
    created_at_desc: { key: "created_at", ascending: false },
    created_at_asc: { key: "created_at", ascending: true },
    score_desc: { key: "avg_performance_score", ascending: false },
    score_asc: { key: "avg_performance_score", ascending: true },
  }, parsed.sort ?? "created_at_desc");

  const sorted = sortRecords(filtered, sortSpec);
  const paginated = paginate(sorted, limit, offset);

  return {
    data: paginated,
    pagination: buildPagination(filtered.length, limit, offset),
  };
};

interface ExperimentDetail {
  id: string;
  created_at: string | null;
  product: {
    id: string;
    name: string | null;
    description: string | null;
  } | null;
  script: {
    id: string;
    title: string | null;
    hook: string | null;
    script_text: string;
    cta: string | null;
    outline: string | null;
  } | null;
  asset: {
    id: string;
    storage_url: string;
    thumbnail_url: string | null;
    duration: number | null;
    tone: string | null;
    layout: string | null;
  } | null;
  published_posts: Array<{
    id: string;
    platform: string;
    external_post_id: string | null;
    published_at: string | null;
    performance_metrics: Array<{
      metric_name: string;
      value: number;
      collected_at: string | null;
    }>;
  }>;
  performance_summary: {
    total_views: number;
    total_engagement: number;
    avg_watch_time: number;
    performance_score: number;
  };
  creative_variables: Record<string, unknown> | null;
  creative_patterns_used: string[];
  agent_notes: Array<{
    id: string;
    agent_name: string;
    topic: string | null;
    content: string;
    importance: number | null;
    created_at: string | null;
  }>;
}

const buildMetricEntries = (metric: {
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  watch_time_ms: number | null;
  completion_rate: number | null;
  collected_at: string | null;
}) => {
  const entries: Array<{
    metric_name: string;
    value: number;
    collected_at: string | null;
  }> = [];

  const addEntry = (metricName: string, value: number | null) => {
    if (value === null || value === undefined) {
      return;
    }
    entries.push({
      metric_name: metricName,
      value,
      collected_at: metric.collected_at ?? null,
    });
  };

  addEntry("views", metric.view_count);
  addEntry("likes", metric.like_count);
  addEntry("comments", metric.comment_count);
  addEntry("shares", metric.share_count);
  addEntry("watch_time_ms", metric.watch_time_ms);
  addEntry("completion_rate", metric.completion_rate);

  return entries;
};

/**
 * Fetches the experiment detail payload.
 */
export const getExperimentDetailApi = async (experimentId: string) => {
  const validatedId = ExperimentIdParamSchema.parse(experimentId);
  const experiment = await getExperimentById(validatedId);

  if (!experiment) {
    return null;
  }

  const [product, script, asset, posts] = await Promise.all([
    experiment.product_id ? getProductById(experiment.product_id) : null,
    experiment.script_id ? getScriptById(experiment.script_id) : null,
    experiment.asset_id ? getVideoAssetById(experiment.asset_id) : null,
    listPostsForExperiment(experiment.experiment_id),
  ]);

  const metrics = await listMetricsForPostIds(posts.map((post) => post.post_id));
  const latestMetricsByPost = buildLatestMetricsByPost(metrics);

  const postScores = posts.map((post) =>
    calculateScore(latestMetricsByPost.get(post.post_id) ?? emptyTotals()),
  );
  const avgPostScore = postScores.length
    ? postScores.reduce((sum, value) => sum + value, 0) / postScores.length
    : 0;
  const maxPostScore = postScores.length ? Math.max(...postScores) : 0;

  const summaryTotals = aggregateTotals(
    posts.map((post) => latestMetricsByPost.get(post.post_id) ?? emptyTotals()),
  );

  const totalEngagement =
    summaryTotals.likes + summaryTotals.comments + summaryTotals.shares;
  const avgWatchTime = posts.length
    ? summaryTotals.watchTimeMs / posts.length
    : 0;

  const performanceScore =
    maxPostScore > 0 ? (avgPostScore / maxPostScore) * 100 : 0;

  const agentNotes = await searchNotesByTopic(experiment.experiment_id);

  const detail: ExperimentDetail = {
    id: experiment.experiment_id,
    created_at: experiment.created_at ?? null,
    product: product
      ? {
          id: product.product_id,
          name: product.name ?? null,
          description: product.description ?? null,
        }
      : null,
    script: script
      ? {
          id: script.script_id,
          title: script.title ?? null,
          hook: script.hook ?? null,
          script_text: script.script_text,
          cta: script.cta ?? null,
          outline: script.outline ?? null,
        }
      : null,
    asset: asset
      ? {
          id: asset.asset_id,
          storage_url: asset.storage_path,
          thumbnail_url: asset.thumbnail_path ?? null,
          duration: asset.duration_seconds ?? null,
          tone: asset.tone ?? null,
          layout: asset.layout ?? null,
        }
      : null,
    published_posts: posts.map((post) => ({
      id: post.post_id,
      platform: post.platform,
      external_post_id: post.platform_post_id ?? null,
      published_at: post.posted_at ?? null,
      performance_metrics: metrics
        .filter((metric) => metric.post_id === post.post_id)
        .flatMap(buildMetricEntries),
    })),
    performance_summary: {
      total_views: summaryTotals.views,
      total_engagement: totalEngagement,
      avg_watch_time: avgWatchTime,
      performance_score: performanceScore,
    },
    creative_variables: (script?.creative_variables as Record<string, unknown> | null) ?? null,
    creative_patterns_used: script?.creative_pattern_id ? [script.creative_pattern_id] : [],
    agent_notes: agentNotes.map((note) => ({
      id: note.note_id,
      agent_name: note.agent_name,
      topic: note.topic ?? null,
      content: note.content,
      importance: note.importance ?? null,
      created_at: note.created_at ?? null,
    })),
  };

  return detail;
};
