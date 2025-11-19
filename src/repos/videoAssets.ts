import { getSupabase } from "../db/db";
import type { Tables, TablesInsert, TablesUpdate } from "../db/types";
import { identifierSchema, nullableDateSchema, z } from "./validators";

const videoAssetInsertSchema = z.object({
  asset_id: identifierSchema.optional(),
  created_at: nullableDateSchema,
  duration_seconds: z.number().nullable().optional(),
  script_id: identifierSchema.nullable().optional(),
  storage_path: z.string().min(1, "Storage path is required"),
  thumbnail_path: z.string().nullable().optional(),
});

const videoAssetUpdateSchema = videoAssetInsertSchema.partial();

const assetIdSchema = identifierSchema.describe("asset_id");

export const createVideoAsset = async (
  payload: TablesInsert<"video_assets">,
) => {
  const validated = videoAssetInsertSchema.parse(payload);
  const { data, error } = await getSupabase()
    .from("video_assets")
    .insert(validated)
    .select("*")
    .returns<Tables<"video_assets">[]>()
    .single();

  if (error) {
    throw new Error(`Failed to create video asset: ${error.message}`);
  }

  return data;
};

export const listVideoAssets = async () => {
  const { data, error } = await getSupabase()
    .from("video_assets")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Tables<"video_assets">[]>();

  if (error) {
    throw new Error(`Failed to list video assets: ${error.message}`);
  }

  return data ?? [];
};

export const getVideoAssetById = async (assetId: string) => {
  const validatedId = assetIdSchema.parse(assetId);
  const { data, error } = await getSupabase()
    .from("video_assets")
    .select("*")
    .eq("asset_id", validatedId)
    .returns<Tables<"video_assets">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch video asset ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const updateVideoAsset = async (
  assetId: string,
  changes: TablesUpdate<"video_assets">,
) => {
  const validatedId = assetIdSchema.parse(assetId);
  const validatedChanges = videoAssetUpdateSchema.parse(changes);
  const { data, error } = await getSupabase()
    .from("video_assets")
    .update(validatedChanges)
    .eq("asset_id", validatedId)
    .select("*")
    .returns<Tables<"video_assets">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to update video asset ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const deleteVideoAsset = async (assetId: string) => {
  const validatedId = assetIdSchema.parse(assetId);
  const { data, error } = await getSupabase()
    .from("video_assets")
    .delete()
    .eq("asset_id", validatedId)
    .select("*")
    .returns<Tables<"video_assets">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to delete video asset ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const listAssetsForScript = async (scriptId: string) => {
  const validatedScriptId = identifierSchema.parse(scriptId);
  const { data, error } = await getSupabase()
    .from("video_assets")
    .select("*")
    .eq("script_id", validatedScriptId)
    .order("created_at", { ascending: false })
    .returns<Tables<"video_assets">[]>();

  if (error) {
    throw new Error(
      `Failed to list assets for script ${validatedScriptId}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const listAssetsMissingThumbnails = async () => {
  const { data, error } = await getSupabase()
    .from("video_assets")
    .select("*")
    .is("thumbnail_path", null)
    .returns<Tables<"video_assets">[]>();

  if (error) {
    throw new Error("Failed to find assets missing thumbnails: " + error.message);
  }

  return data ?? [];
};
