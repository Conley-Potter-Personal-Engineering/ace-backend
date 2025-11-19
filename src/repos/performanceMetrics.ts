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
