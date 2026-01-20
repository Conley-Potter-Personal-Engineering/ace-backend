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
