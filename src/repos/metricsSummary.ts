import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/db/db";
import type { Database, Tables } from "@/db/types";

const fetchRange = async <T>(
  table: keyof Database["public"]["Tables"],
  startDate: string,
  endDate: string,
  supabase: SupabaseClient<Database>,
): Promise<T[]> => {
  const baseQuery = supabase.from(table);
  const query = baseQuery.select("*") ?? baseQuery;
  query.gte?.("created_at", startDate);
  query.lte?.("created_at", endDate);
  const response = (query.returns
    ? await query.returns<T[]>()
    : await query) as { data: T[] | null; error: { message: string } | null } | undefined;
  const { data, error } = response ?? { data: null, error: null };

  if (error) {
    throw new Error(`Failed to fetch ${table}: ${error.message}`);
  }

  return data ?? [];
};

export const fetchScriptsCreatedBetween = async (
  startDate: string,
  endDate: string,
  supabase: SupabaseClient<Database> = getSupabase(),
): Promise<Tables<"scripts">[]> =>
  fetchRange<Tables<"scripts">>("scripts", startDate, endDate, supabase);

export const fetchVideoAssetsCreatedBetween = async (
  startDate: string,
  endDate: string,
  supabase: SupabaseClient<Database> = getSupabase(),
): Promise<Tables<"video_assets">[]> =>
  fetchRange<Tables<"video_assets">>("video_assets", startDate, endDate, supabase);

export const fetchPublishedPostsCreatedBetween = async (
  startDate: string,
  endDate: string,
  supabase: SupabaseClient<Database> = getSupabase(),
): Promise<Tables<"published_posts">[]> =>
  fetchRange<Tables<"published_posts">>("published_posts", startDate, endDate, supabase);

export const fetchPerformanceMetricsBetween = async (
  startDate: string,
  endDate: string,
  supabase: SupabaseClient<Database> = getSupabase(),
): Promise<Tables<"performance_metrics">[]> => {
  const baseQuery = supabase.from("performance_metrics");
  const query = baseQuery.select("*") ?? baseQuery;
  query.gte?.("collected_at", startDate);
  query.lte?.("collected_at", endDate);
  const response = (query.returns
    ? await query.returns<Tables<"performance_metrics">[]>()
    : await query) as
    | { data: Tables<"performance_metrics">[] | null; error: { message: string } | null }
    | undefined;
  const { data, error } = response ?? { data: null, error: null };

  if (error) {
    throw new Error(`Failed to fetch performance metrics: ${error.message}`);
  }

  return data ?? [];
};

export interface SystemEventFilters {
  startDate: string;
  endDate: string;
  severities?: Array<Tables<"system_events">["severity"]>;
  eventTypeLike?: string;
}

export const fetchSystemEvents = async (
  filters: SystemEventFilters,
  supabase: SupabaseClient<Database> = getSupabase(),
): Promise<Tables<"system_events">[]> => {
  const baseQuery = supabase.from("system_events");
  const query = baseQuery.select("*") ?? baseQuery;
  query.gte?.("created_at", filters.startDate);
  query.lte?.("created_at", filters.endDate);

  if (filters.severities?.length) {
    query.in?.("severity", filters.severities);
  }

  if (filters.eventTypeLike) {
    query.ilike?.("event_type", `%${filters.eventTypeLike}%`);
  }

  const response = (query.returns
    ? await query.returns<Tables<"system_events">[]>()
    : await query) as
    | { data: Tables<"system_events">[] | null; error: { message: string } | null }
    | undefined;
  const { data, error } = response ?? { data: null, error: null };

  if (error) {
    throw new Error(`Failed to fetch system events: ${error.message}`);
  }

  return data ?? [];
};
