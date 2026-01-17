import type { Tables } from "@/db/types";
import type { ExperimentWithProduct } from "@/lib/api/repositories/performanceMetricsRepository";

export type PerformanceMetric = Tables<"performance_metrics">;
export type Granularity = "hour" | "day" | "week";

export interface TimeSeriesBucket {
  date: string;
  views: number;
  engagement: number;
}

export interface RankedExperiment {
  experiment_id: string;
  product_name: string | null;
  platform: string;
  performance_score: number;
}

interface MetricTotals {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

const toNumber = (value: number | null | undefined): number => value ?? 0;

export const calculateEngagement = (
  metric: Pick<PerformanceMetric, "like_count" | "comment_count" | "share_count">,
): number =>
  toNumber(metric.like_count) +
  toNumber(metric.comment_count) +
  toNumber(metric.share_count);

export const calculatePerformanceScore = (
  metric: Pick<PerformanceMetric, "view_count" | "like_count" | "comment_count" | "share_count">,
): number =>
  toNumber(metric.view_count) * 0.3 +
  toNumber(metric.like_count) * 2 +
  toNumber(metric.comment_count) * 3 +
  toNumber(metric.share_count) * 4;

const startOfHourUtc = (date: Date): Date =>
  new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
  ));

const startOfDayUtc = (date: Date): Date =>
  new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  ));

const startOfWeekUtc = (date: Date): Date => {
  const day = date.getUTCDay();
  const diff = (day + 6) % 7;
  const startOfDay = startOfDayUtc(date);
  startOfDay.setUTCDate(startOfDay.getUTCDate() - diff);
  return startOfDay;
};

const bucketStartFor = (date: Date, granularity: Granularity): Date => {
  if (granularity === "hour") {
    return startOfHourUtc(date);
  }

  if (granularity === "week") {
    return startOfWeekUtc(date);
  }

  return startOfDayUtc(date);
};

const addBuckets = (date: Date, granularity: Granularity): Date => {
  const next = new Date(date.getTime());

  if (granularity === "hour") {
    next.setUTCHours(next.getUTCHours() + 1);
    return next;
  }

  if (granularity === "week") {
    next.setUTCDate(next.getUTCDate() + 7);
    return next;
  }

  next.setUTCDate(next.getUTCDate() + 1);
  return next;
};

const resolveRange = (
  metrics: PerformanceMetric[],
  startDate?: string,
  endDate?: string,
): { start: Date; end: Date } | null => {
  if (startDate && endDate) {
    return { start: new Date(startDate), end: new Date(endDate) };
  }

  if (!metrics.length) {
    return null;
  }

  const sorted = metrics
    .filter((metric) => Boolean(metric.collected_at))
    .map((metric) => new Date(metric.collected_at as string))
    .sort((a, b) => a.getTime() - b.getTime());

  if (!sorted.length) {
    return null;
  }

  return { start: sorted[0], end: sorted[sorted.length - 1] };
};

export const groupMetricsByTimeBucket = (
  metrics: PerformanceMetric[],
  granularity: Granularity,
  startDate?: string,
  endDate?: string,
): TimeSeriesBucket[] => {
  const range = resolveRange(metrics, startDate, endDate);
  if (!range) {
    return [];
  }

  const rangeStart = range.start;
  const rangeEnd = range.end;

  if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
    return [];
  }

  const startBucket = bucketStartFor(rangeStart, granularity);
  const endBucket = bucketStartFor(rangeEnd, granularity);

  const buckets = new Map<string, TimeSeriesBucket>();
  for (let cursor = startBucket; cursor <= endBucket; cursor = addBuckets(cursor, granularity)) {
    const key = cursor.toISOString();
    buckets.set(key, { date: key, views: 0, engagement: 0 });
  }

  for (const metric of metrics) {
    if (!metric.collected_at) {
      continue;
    }

    const collectedAt = new Date(metric.collected_at);
    if (collectedAt < rangeStart || collectedAt > rangeEnd) {
      continue;
    }

    const bucketStart = bucketStartFor(collectedAt, granularity);
    const key = bucketStart.toISOString();
    const bucket = buckets.get(key) ?? { date: key, views: 0, engagement: 0 };

    bucket.views += toNumber(metric.view_count);
    bucket.engagement += calculateEngagement(metric);
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
};

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

export const rankExperimentsByScore = (
  experiments: ExperimentWithProduct[],
  metrics: PerformanceMetric[],
): RankedExperiment[] => {
  if (!experiments.length || !metrics.length) {
    return [];
  }

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

  const experimentsById = new Map<
    string,
    { product_name: string | null; posts: Array<{ post_id: string; platform: string }> }
  >();

  for (const entry of experiments) {
    const existing = experimentsById.get(entry.experiment_id) ?? {
      product_name: entry.product_name ?? null,
      posts: [],
    };

    if (!existing.product_name && entry.product_name) {
      existing.product_name = entry.product_name;
    }

    existing.posts.push({ post_id: entry.post_id, platform: entry.platform });
    experimentsById.set(entry.experiment_id, existing);
  }

  const ranked: RankedExperiment[] = [];
  for (const [experimentId, entry] of experimentsById.entries()) {
    let totalScore = 0;
    let count = 0;
    let topPlatform = entry.posts[0]?.platform ?? "";
    let topScore = -Infinity;

    for (const post of entry.posts) {
      const totals = totalsByPost.get(post.post_id) ?? emptyTotals();
      const score = scoreFromTotals(totals);

      totalScore += score;
      count += 1;

      if (score > topScore) {
        topScore = score;
        topPlatform = post.platform;
      }
    }

    const avgScore = count > 0 ? totalScore / count : 0;

    ranked.push({
      experiment_id: experimentId,
      product_name: entry.product_name ?? null,
      platform: topPlatform,
      performance_score: avgScore,
    });
  }

  ranked.sort((a, b) => b.performance_score - a.performance_score);
  return ranked.slice(0, 5);
};
