import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/db/db";
import type { Database, Tables } from "@/db/types";

const fetchRange = async <T>(
  table: keyof Database["public"]["Tables"],
  startDate: string,
  endDate: string,
  supabase: SupabaseClient<Database>,
): Promise<T[]> => {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .returns<T[]>();

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
  const { data, error } = await supabase
    .from("performance_metrics")
    .select("*")
    .gte("collected_at", startDate)
    .lte("collected_at", endDate)
    .returns<Tables<"performance_metrics">[]>();

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
  let query = supabase
    .from("system_events")
    .select("*")
    .gte("created_at", filters.startDate)
    .lte("created_at", filters.endDate);

  if (filters.severities?.length) {
    query = query.in("severity", filters.severities);
  }

  if (filters.eventTypeLike) {
    query = query.ilike("event_type", `%${filters.eventTypeLike}%`);
  }

  const { data, error } = await query.returns<Tables<"system_events">[]>();

  if (error) {
    throw new Error(`Failed to fetch system events: ${error.message}`);
  }

  return data ?? [];
};
