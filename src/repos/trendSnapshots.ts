import { getSupabase } from "../db/db";
import type { Tables, TablesInsert, TablesUpdate } from "../db/types";
import {
  identifierSchema,
  jsonSchema,
  nullableDateSchema,
  stringArraySchema,
  z,
} from "./validators";

const trendSnapshotInsertSchema = z.object({
    competition_score: z.number().nullable().optional(),
    popularity_score: z.number().nullable().optional(),
    product_id: identifierSchema,
    raw_source_data: jsonSchema.nullable().optional(),
    snapshot_id: identifierSchema.optional(),
    snapshot_time: nullableDateSchema,
    tiktok_trend_tags: stringArraySchema.nullable().optional(),
    velocity_score: z.number().nullable().optional(),
  });

const trendSnapshotUpdateSchema = trendSnapshotInsertSchema.partial();

const snapshotIdSchema = identifierSchema.describe("snapshot_id");

export const createTrendSnapshot = async (
  payload: TablesInsert<"trend_snapshots">,
) => {
  const validated = trendSnapshotInsertSchema.parse(payload);
  const { data, error } = await getSupabase()
    .from("trend_snapshots")
    .insert(validated)
    .select("*")
    .returns<Tables<"trend_snapshots">[]>()
    .single();

  if (error) {
    throw new Error(`Failed to create trend snapshot: ${error.message}`);
  }

  return data;
};

export const listTrendSnapshots = async () => {
  const { data, error } = await getSupabase()
    .from("trend_snapshots")
    .select("*")
    .order("snapshot_time", { ascending: false })
    .returns<Tables<"trend_snapshots">[]>();

  if (error) {
    throw new Error(`Failed to list trend snapshots: ${error.message}`);
  }

  return data ?? [];
};

export const getTrendSnapshotById = async (snapshotId: string) => {
  const validatedId = snapshotIdSchema.parse(snapshotId);
  const { data, error } = await getSupabase()
    .from("trend_snapshots")
    .select("*")
    .eq("snapshot_id", validatedId)
    .returns<Tables<"trend_snapshots">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch trend snapshot ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const updateTrendSnapshot = async (
  snapshotId: string,
  changes: TablesUpdate<"trend_snapshots">,
) => {
  const validatedId = snapshotIdSchema.parse(snapshotId);
  const validatedChanges = trendSnapshotUpdateSchema.parse(changes);
  const { data, error } = await getSupabase()
    .from("trend_snapshots")
    .update(validatedChanges)
    .eq("snapshot_id", validatedId)
    .select("*")
    .returns<Tables<"trend_snapshots">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to update trend snapshot ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const deleteTrendSnapshot = async (snapshotId: string) => {
  const validatedId = snapshotIdSchema.parse(snapshotId);
  const { data, error } = await getSupabase()
    .from("trend_snapshots")
    .delete()
    .eq("snapshot_id", validatedId)
    .select("*")
    .returns<Tables<"trend_snapshots">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to delete trend snapshot ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const listSnapshotsForProduct = async (productId: string) => {
  const validatedProductId = identifierSchema.parse(productId);
  const { data, error } = await getSupabase()
    .from("trend_snapshots")
    .select("*")
    .eq("product_id", validatedProductId)
    .order("snapshot_time", { ascending: false })
    .returns<Tables<"trend_snapshots">[]>();

  if (error) {
    throw new Error(
      `Failed to list snapshots for product ${validatedProductId}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const getLatestSnapshotForProduct = async (productId: string) => {
  const validatedProductId = identifierSchema.parse(productId);
  const { data, error } = await getSupabase()
    .from("trend_snapshots")
    .select("*")
    .eq("product_id", validatedProductId)
    .order("snapshot_time", { ascending: false })
    .limit(1)
    .returns<Tables<"trend_snapshots">[]>();

  if (error) {
    throw new Error(
      `Failed to fetch latest snapshot for product ${validatedProductId}: ${error.message}`,
    );
  }

  return (data ?? [])[0] ?? null;
};

export const listHighVelocitySnapshots = async (minimumVelocity = 0.7) => {
  const validatedThreshold = z.number().min(0).parse(minimumVelocity);
  const { data, error } = await getSupabase()
    .from("trend_snapshots")
    .select("*")
    .gte("velocity_score", validatedThreshold)
    .order("velocity_score", { ascending: false })
    .returns<Tables<"trend_snapshots">[]>();

  if (error) {
    throw new Error(
      `Failed to list high velocity snapshots: ${error.message}`,
    );
  }

  return data ?? [];
};
