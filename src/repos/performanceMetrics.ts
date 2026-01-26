import { getSupabase } from "../db/db";
import type { Tables, TablesInsert, TablesUpdate } from "../db/types";
import { identifierSchema, nullableDateSchema, z } from "./validators";

const performanceMetricInsertSchema = z.object({
  collected_at: nullableDateSchema,
  comment_count: z.number().nullable().optional(),
  completion_rate: z.number().nullable().optional(),
  like_count: z.number().nullable().optional(),
  metric_id: identifierSchema.optional(),
  post_id: identifierSchema.nullable().optional(),
  share_count: z.number().nullable().optional(),
  view_count: z.number().nullable().optional(),
  watch_time_ms: z.number().nullable().optional(),
});

const performanceMetricUpdateSchema = performanceMetricInsertSchema.partial();

const metricIdSchema = identifierSchema.describe("metric_id");

export const logPerformanceMetric = async (
  payload: TablesInsert<"performance_metrics">,
) => {
  const validated = performanceMetricInsertSchema.parse(payload);
  const { data, error } = await getSupabase()
    .from("performance_metrics")
    .insert(validated)
    .select("*")
    .returns<Tables<"performance_metrics">[]>()
    .single();

  if (error) {
    throw new Error(`Failed to log performance metric: ${error.message}`);
  }

  return data;
};

export const listPerformanceMetrics = async () => {
  const { data, error } = await getSupabase()
    .from("performance_metrics")
    .select("*")
    .order("collected_at", { ascending: false })
    .returns<Tables<"performance_metrics">[]>();

  if (error) {
    throw new Error(`Failed to list performance metrics: ${error.message}`);
  }

  return data ?? [];
};

export const getPerformanceMetricById = async (metricId: string) => {
  const validatedId = metricIdSchema.parse(metricId);
  const { data, error } = await getSupabase()
    .from("performance_metrics")
    .select("*")
    .eq("metric_id", validatedId)
    .returns<Tables<"performance_metrics">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch performance metric ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const updatePerformanceMetric = async (
  metricId: string,
  changes: TablesUpdate<"performance_metrics">,
) => {
  const validatedId = metricIdSchema.parse(metricId);
  const validatedChanges = performanceMetricUpdateSchema.parse(changes);
  const { data, error } = await getSupabase()
    .from("performance_metrics")
    .update(validatedChanges)
    .eq("metric_id", validatedId)
    .select("*")
    .returns<Tables<"performance_metrics">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to update performance metric ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const deletePerformanceMetric = async (metricId: string) => {
  const validatedId = metricIdSchema.parse(metricId);
  const { data, error } = await getSupabase()
    .from("performance_metrics")
    .delete()
    .eq("metric_id", validatedId)
    .select("*")
    .returns<Tables<"performance_metrics">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to delete performance metric ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const listMetricsForPost = async (postId: string) => {
  const validatedPostId = identifierSchema.parse(postId);
  const { data, error } = await getSupabase()
    .from("performance_metrics")
    .select("*")
    .eq("post_id", validatedPostId)
    .order("collected_at", { ascending: false })
    .returns<Tables<"performance_metrics">[]>();

  if (error) {
    throw new Error(
      `Failed to list metrics for post ${validatedPostId}: ${error.message}`,
    );
  }

  return data ?? [];
};

/**
 * Lists performance metrics for a set of post ids.
 */
export const listMetricsForPostIds = async (postIds: string[]) => {
  if (!postIds.length) {
    return [];
  }

  const { data, error } = await getSupabase()
    .from("performance_metrics")
    .select("*")
    .in("post_id", postIds)
    .order("collected_at", { ascending: false })
    .returns<Tables<"performance_metrics">[]>();

  if (error) {
    throw new Error(
      `Failed to list metrics for posts: ${error.message}`,
    );
  }

  return data ?? [];
};

export const getLatestMetricsForPost = async (postId: string) => {
  const validatedPostId = identifierSchema.parse(postId);
  const { data, error } = await getSupabase()
    .from("performance_metrics")
    .select("*")
    .eq("post_id", validatedPostId)
    .order("collected_at", { ascending: false })
    .limit(1)
    .returns<Tables<"performance_metrics">[]>();

  if (error) {
    throw new Error(
      `Failed to fetch latest metrics for post ${validatedPostId}: ${error.message}`,
    );
  }

  return (data ?? [])[0] ?? null;
};

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

const platformSchema = z.enum([
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "linkedin",
  "x",
]);

const postFiltersSchema = z.object({
  platform: platformSchema.optional(),
  experiment_id: identifierSchema.optional(),
  product_id: identifierSchema.optional(),
});

const dateRangeSchema = z.object({
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
});

const postIdsSchema = z.array(identifierSchema).min(1);

export const getPostsByFilters = async (
  filters: PostFilters,
): Promise<Tables<"published_posts">[]> => {
  const validated = postFiltersSchema.parse(filters);
  const selectFields = validated.product_id
    ? "post_id, experiment_id, platform, posted_at, experiments!inner(product_id)"
    : "post_id, experiment_id, platform, posted_at";

  let query = getSupabase().from("published_posts").select(selectFields);

  if (validated.platform) {
    query = query.eq("platform", validated.platform);
  }

  if (validated.experiment_id) {
    query = query.eq("experiment_id", validated.experiment_id);
  }

  if (validated.product_id) {
    query = query.eq("experiments.product_id", validated.product_id);
  }

  const { data, error } = await query.returns<PublishedPostRow[]>();

  if (error) {
    throw new Error(`Failed to fetch posts for performance metrics: ${error.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (data ?? []).map(({ experiments, ...post }) => post);
};

export const getMetricsByPostsAndDateRange = async (
  postIds: string[],
  startDate: string,
  endDate: string,
): Promise<Tables<"performance_metrics">[]> => {
  if (!postIds.length) {
    return [];
  }

  const validatedPostIds = postIdsSchema.parse(postIds);
  const { startDate: validatedStart, endDate: validatedEnd } = dateRangeSchema.parse({
    startDate,
    endDate,
  });

  const { data, error } = await getSupabase()
    .from("performance_metrics")
    .select("*")
    .in("post_id", validatedPostIds)
    .gte("collected_at", validatedStart)
    .lte("collected_at", validatedEnd)
    .order("collected_at", { ascending: true })
    .returns<Tables<"performance_metrics">[]>();

  if (error) {
    throw new Error(`Failed to fetch performance metrics: ${error.message}`);
  }

  return data ?? [];
};

export const getExperimentsWithProductsByPostIds = async (
  postIds: string[],
): Promise<ExperimentWithProduct[]> => {
  if (!postIds.length) {
    return [];
  }

  const validatedPostIds = postIdsSchema.parse(postIds);
  const { data, error } = await getSupabase()
    .from("published_posts")
    .select(
      "post_id, platform, experiment_id, experiments!inner(experiment_id, product_id, products(name))",
    )
    .in("post_id", validatedPostIds)
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

export const getPostMetrics = async (postId: string): Promise<PostMetricsData | null> => {
  const validatedPostId = identifierSchema.parse(postId);
  const { data: post, error: postError } = await getSupabase()
    .from("published_posts")
    .select("post_id, platform, platform_post_id")
    .eq("post_id", validatedPostId)
    .returns<Tables<"published_posts">[]>()
    .maybeSingle();

  if (postError) {
    throw new Error(`Failed to fetch post for metrics: ${postError.message}`);
  }

  if (!post) {
    return null;
  }

  const { data: metricsRows, error: metricsError } = await getSupabase()
    .from("performance_metrics")
    .select("collected_at, view_count, like_count, comment_count, share_count, watch_time_ms")
    .eq("post_id", validatedPostId)
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
