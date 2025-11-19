import { getSupabase } from "./supabase";
import type { TablesInsert } from "./types";

export const insertScript = (script: TablesInsert<"scripts">) =>
  getSupabase().from("scripts").insert(script).select().single();

export const selectScripts = () => getSupabase().from("scripts").select("*");

export const insertVideoAsset = (asset: TablesInsert<"video_assets">) =>
  getSupabase().from("video_assets").insert(asset).select().single();

export const selectVideoAssets = () =>
  getSupabase().from("video_assets").select("*");

export const insertExperiment = (experiment: TablesInsert<"experiments">) =>
  getSupabase().from("experiments").insert(experiment).select().single();

export const selectExperiments = () =>
  getSupabase().from("experiments").select("*");

export const insertPublishedPost = (
  post: TablesInsert<"published_posts">,
) => getSupabase().from("published_posts").insert(post).select().single();

export const selectPublishedPosts = () =>
  getSupabase().from("published_posts").select("*");

export const logPerformanceMetric = (
  metric: TablesInsert<"performance_metrics">,
) =>
  getSupabase().from("performance_metrics").insert(metric).select().single();

export const selectPerformanceMetrics = () =>
  getSupabase().from("performance_metrics").select("*");

export const logSystemEvent = (event: TablesInsert<"system_events">) =>
  getSupabase().from("system_events").insert(event).select().single();

export const selectSystemEvents = () =>
  getSupabase().from("system_events").select("*");

export const aceDb = {
  insertScript,
  selectScripts,
  insertVideoAsset,
  selectVideoAssets,
  insertExperiment,
  selectExperiments,
  insertPublishedPost,
  selectPublishedPosts,
  logPerformanceMetric,
  selectPerformanceMetrics,
  logSystemEvent,
  selectSystemEvents,
};

export type AceDb = typeof aceDb;

export { getSupabase };

