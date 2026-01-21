import type { Tables } from "@/db/types";
import { getSupabase } from "@/db/supabase";
import {
  getExperimentsWithProductsByPostIds,
  getMetricsByPostsAndDateRange,
  getPostMetrics,
  getPostsByFilters,
} from "@/lib/api/repositories/performanceMetricsRepository";
import {
  calculateEngagement,
  groupMetricsByTimeBucket,
  rankExperimentsByScore,
  type Granularity,
} from "@/lib/api/utils/metricsAggregation";
import { PerformanceMetricsQuerySchema, PostIdParamSchema } from "@/schemas/apiSchemas";

interface SummaryTotals {
  total_views: number;
  total_engagement: number;
  avg_watch_time: number;
  top_performing_post: {
    post_id: string;
    experiment_id: string;
    platform: string;
    score: number;
  } | null;
}

interface MetricTotals {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

const toNumber = (value: number | null | undefined): number => value ?? 0;

const emptyTotals = (): MetricTotals => ({
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
});

const scoreFromTotals = (totals: MetricTotals): number =>
  totals.views * 0.3 +
  totals.likes * 2 +
  totals.comments * 3 +
  totals.shares * 4;

const buildSummary = (
  metrics: Tables<"performance_metrics">[],
  posts: Tables<"published_posts">[],
): SummaryTotals => {
  const totalViews = metrics.reduce(
    (sum, metric) => sum + toNumber(metric.view_count),
    0,
  );
  const totalEngagement = metrics.reduce(
    (sum, metric) => sum + calculateEngagement(metric),
    0,
  );
  const totalWatchTime = metrics.reduce(
    (sum, metric) => sum + toNumber(metric.watch_time_ms),
    0,
  );
  const avgWatchTime = metrics.length ? totalWatchTime / metrics.length : 0;

  const postsById = new Map(
    posts.map((post) => [
      post.post_id,
      {
        experiment_id: post.experiment_id,
        platform: post.platform,
      },
    ]),
  );

  const totalsByPost = new Map<string, MetricTotals>();
  for (const metric of metrics) {
    if (!metric.post_id) {
      continue;
    }

    const current = totalsByPost.get(metric.post_id) ?? emptyTotals();
    current.views += toNumber(metric.view_count);
    current.likes += toNumber(metric.like_count);
    current.comments += toNumber(metric.comment_count);
    current.shares += toNumber(metric.share_count);
    totalsByPost.set(metric.post_id, current);
  }

  let topPost: SummaryTotals["top_performing_post"] = null;
  let topScore = -Infinity;

  for (const [postId, totals] of totalsByPost.entries()) {
    const postInfo = postsById.get(postId);
    if (!postInfo?.experiment_id) {
      continue;
    }

    const score = scoreFromTotals(totals);
    if (score > topScore) {
      topScore = score;
      topPost = {
        post_id: postId,
        experiment_id: postInfo.experiment_id,
        platform: postInfo.platform,
        score,
      };
    }
  }

  return {
    total_views: totalViews,
    total_engagement: totalEngagement,
    avg_watch_time: avgWatchTime,
    top_performing_post: topPost,
  };
};

export const getPerformanceMetricsApi = async (
  rawQuery: Record<string, string | undefined>,
) => {
  const parsed = PerformanceMetricsQuerySchema.parse(rawQuery);
  const platformFilter = parsed.platform;
  const granularity = parsed.granularity as Granularity;

  // TODO: Add Redis caching (2-5 minute TTL) keyed by query params.
  const supabase = getSupabase();
  const posts = await getPostsByFilters(supabase, {
    platform: platformFilter === "all" ? undefined : platformFilter,
    experiment_id: parsed.experiment_id,
    product_id: parsed.product_id,
  });

  const postIds = posts.map((post) => post.post_id);
  const metrics = await getMetricsByPostsAndDateRange(
    supabase,
    postIds,
    parsed.start_date,
    parsed.end_date,
  );

  const summary = buildSummary(metrics, posts);
  const timeSeries = groupMetricsByTimeBucket(
    metrics,
    granularity,
    parsed.start_date,
    parsed.end_date,
  );
  const timeSeriesWithPlatform = platformFilter === "all"
    ? timeSeries
    : timeSeries.map((bucket) => ({
        ...bucket,
        platform: platformFilter,
      }));

  const topExperiments = metrics.length
    ? rankExperimentsByScore(
        await getExperimentsWithProductsByPostIds(supabase, postIds),
        metrics,
      )
    : [];

  return {
    summary,
    time_series: timeSeriesWithPlatform,
    top_experiments: topExperiments,
  };
};

export const getPostPerformanceMetricsApi = async (postId: string) => {
  const validatedId = PostIdParamSchema.parse(postId);
  const supabase = getSupabase();
  return getPostMetrics(supabase, validatedId);
};
