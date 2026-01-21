import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/db/types";

export type Platform = "instagram" | "tiktok" | "youtube" | "facebook" | "linkedin" | "x";

export interface PostFilters {
  platform?: Platform;
  experiment_id?: string;
  product_id?: string;
}

export interface ExperimentWithProduct {
  post_id: string;
  experiment_id: string;
  platform: string;
  product_name: string | null;
}

type MetricName = "views" | "likes" | "comments" | "shares" | "watch_time_avg";

export interface PostMetricEntry {
  metric_name: MetricName;
  value: number;
  collected_at: string;
}

export interface PostMetricsData {
  post_id: string;
  platform: string;
  external_post_id: string | null;
  metrics: PostMetricEntry[];
  last_updated: string | null;
}

type PublishedPostRow = Tables<"published_posts"> & {
  experiments?: {
    product_id: string | null;
  } | null;
};

type PublishedPostExperimentRow = Tables<"published_posts"> & {
  experiments: {
    experiment_id: string;
    product_id: string | null;
    products: {
      name: string;
    } | null;
  } | null;
};

export const getPostsByFilters = async (
  supabase: SupabaseClient<Database>,
  filters: PostFilters,
): Promise<Tables<"published_posts">[]> => {
  const selectFields = filters.product_id
    ? "post_id, experiment_id, platform, posted_at, experiments!inner(product_id)"
    : "post_id, experiment_id, platform, posted_at";

  let query = supabase.from("published_posts").select(selectFields);

  if (filters.platform) {
    query = query.eq("platform", filters.platform);
  }

  if (filters.experiment_id) {
    query = query.eq("experiment_id", filters.experiment_id);
  }

  if (filters.product_id) {
    query = query.eq("experiments.product_id", filters.product_id);
  }

  const { data, error } = await query.returns<PublishedPostRow[]>();

  if (error) {
    throw new Error(`Failed to fetch posts for performance metrics: ${error.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (data ?? []).map(({ experiments, ...post }) => post);
};

export const getMetricsByPostsAndDateRange = async (
  supabase: SupabaseClient<Database>,
  postIds: string[],
  startDate: string,
  endDate: string,
): Promise<Tables<"performance_metrics">[]> => {
  if (!postIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("performance_metrics")
    .select("*")
    .in("post_id", postIds)
    .gte("collected_at", startDate)
    .lte("collected_at", endDate)
    .order("collected_at", { ascending: true })
    .returns<Tables<"performance_metrics">[]>();

  if (error) {
    throw new Error(`Failed to fetch performance metrics: ${error.message}`);
  }

  return data ?? [];
};

export const getExperimentsWithProductsByPostIds = async (
  supabase: SupabaseClient<Database>,
  postIds: string[],
): Promise<ExperimentWithProduct[]> => {
  if (!postIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("published_posts")
    .select(
      "post_id, platform, experiment_id, experiments!inner(experiment_id, product_id, products(name))",
    )
    .in("post_id", postIds)
    .returns<PublishedPostExperimentRow[]>();

  if (error) {
    throw new Error(`Failed to fetch experiments for posts: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => {
      const experimentId = row.experiments?.experiment_id ?? row.experiment_id;
      if (!experimentId) {
        return null;
      }
      return {
        post_id: row.post_id,
        experiment_id: experimentId,
        platform: row.platform,
        product_name: row.experiments?.products?.name ?? null,
      };
    })
    .filter((row): row is ExperimentWithProduct => row !== null);
};

export const getPostMetrics = async (
  supabase: SupabaseClient<Database>,
  postId: string,
): Promise<PostMetricsData | null> => {
  const { data: post, error: postError } = await supabase
    .from("published_posts")
    .select("post_id, platform, platform_post_id")
    .eq("post_id", postId)
    .returns<Tables<"published_posts">[]>()
    .maybeSingle();

  if (postError) {
    throw new Error(`Failed to fetch post for metrics: ${postError.message}`);
  }

  if (!post) {
    return null;
  }

  const { data: metricsRows, error: metricsError } = await supabase
    .from("performance_metrics")
    .select("collected_at, view_count, like_count, comment_count, share_count, watch_time_ms")
    .eq("post_id", postId)
    .order("collected_at", { ascending: true })
    .returns<Tables<"performance_metrics">[]>();

  if (metricsError) {
    throw new Error(`Failed to fetch performance metrics: ${metricsError.message}`);
  }

  const metrics: PostMetricEntry[] = [];
  let latestCollectedAt: string | null = null;

  const pushMetric = (
    metricName: MetricName,
    value: number | null,
    collectedAt: string | null,
  ) => {
    if (value === null || value === undefined || !collectedAt) {
      return;
    }
    metrics.push({
      metric_name: metricName,
      value,
      collected_at: collectedAt,
    });
  };

  for (const row of metricsRows ?? []) {
    if (row.collected_at) {
      if (!latestCollectedAt || row.collected_at > latestCollectedAt) {
        latestCollectedAt = row.collected_at;
      }
    }

    pushMetric("views", row.view_count, row.collected_at);
    pushMetric("likes", row.like_count, row.collected_at);
    pushMetric("comments", row.comment_count, row.collected_at);
    pushMetric("shares", row.share_count, row.collected_at);
    pushMetric("watch_time_avg", row.watch_time_ms, row.collected_at);
  }

  metrics.sort((a, b) => {
    if (a.metric_name !== b.metric_name) {
      return a.metric_name.localeCompare(b.metric_name);
    }
    return a.collected_at.localeCompare(b.collected_at);
  });

  return {
    post_id: post.post_id,
    platform: post.platform,
    external_post_id: post.platform_post_id ?? null,
    metrics,
    last_updated: latestCollectedAt,
  };
};
