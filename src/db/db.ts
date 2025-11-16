import { supabase } from "./supabase";
import type { TablesInsert } from "./types";

type AceTableName =
  | "scripts"
  | "video_assets"
  | "experiments"
  | "published_posts"
  | "performance_metrics"
  | "system_events";

const insertSingle = <TableName extends AceTableName>(
  table: TableName,
  payload: TablesInsert<TableName>,
) =>
  supabase
    .from(table)
    .insert(payload)
    .select()
    .single();

const selectAll = <TableName extends AceTableName>(table: TableName) =>
  supabase.from(table).select("*");

export const insertScript = (script: TablesInsert<"scripts">) =>
  insertSingle("scripts", script);

export const selectScripts = () => selectAll("scripts");

export const insertVideoAsset = (asset: TablesInsert<"video_assets">) =>
  insertSingle("video_assets", asset);

export const selectVideoAssets = () => selectAll("video_assets");

export const insertExperiment = (experiment: TablesInsert<"experiments">) =>
  insertSingle("experiments", experiment);

export const selectExperiments = () => selectAll("experiments");

export const insertPublishedPost = (post: TablesInsert<"published_posts">) =>
  insertSingle("published_posts", post);

export const selectPublishedPosts = () => selectAll("published_posts");

export const logPerformanceMetric = (
  metric: TablesInsert<"performance_metrics">,
) => insertSingle("performance_metrics", metric);

export const selectPerformanceMetrics = () =>
  selectAll("performance_metrics");

export const logSystemEvent = (event: TablesInsert<"system_events">) =>
  insertSingle("system_events", event);

export const selectSystemEvents = () => selectAll("system_events");

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

