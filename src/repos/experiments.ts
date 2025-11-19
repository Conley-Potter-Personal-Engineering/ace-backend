import { getSupabase } from "../db/db";
import type { Tables, TablesInsert, TablesUpdate } from "../db/types";
import { identifierSchema, nullableDateSchema, z } from "./validators";

const experimentInsertSchema = z.object({
  asset_id: identifierSchema.nullable().optional(),
  created_at: nullableDateSchema,
  experiment_id: identifierSchema.optional(),
  hypothesis: z.string().trim().nullable().optional(),
  product_id: identifierSchema.nullable().optional(),
  script_id: identifierSchema.nullable().optional(),
  variation_label: z.string().trim().nullable().optional(),
});

const experimentUpdateSchema = experimentInsertSchema.partial();

const experimentIdSchema = identifierSchema.describe("experiment_id");

export const createExperiment = async (
  payload: TablesInsert<"experiments">,
) => {
  const validated = experimentInsertSchema.parse(payload);
  const { data, error } = await getSupabase()
    .from("experiments")
    .insert(validated)
    .select("*")
    .returns<Tables<"experiments">[]>()
    .single();

  if (error) {
    throw new Error(`Failed to create experiment: ${error.message}`);
  }

  return data;
};

export const listExperiments = async () => {
  const { data, error } = await getSupabase()
    .from("experiments")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Tables<"experiments">[]>();

  if (error) {
    throw new Error(`Failed to list experiments: ${error.message}`);
  }

  return data ?? [];
};

export const getExperimentById = async (experimentId: string) => {
  const validatedId = experimentIdSchema.parse(experimentId);
  const { data, error } = await getSupabase()
    .from("experiments")
    .select("*")
    .eq("experiment_id", validatedId)
    .returns<Tables<"experiments">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch experiment ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const updateExperiment = async (
  experimentId: string,
  changes: TablesUpdate<"experiments">,
) => {
  const validatedId = experimentIdSchema.parse(experimentId);
  const validatedChanges = experimentUpdateSchema.parse(changes);
  const { data, error } = await getSupabase()
    .from("experiments")
    .update(validatedChanges)
    .eq("experiment_id", validatedId)
    .select("*")
    .returns<Tables<"experiments">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to update experiment ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const deleteExperiment = async (experimentId: string) => {
  const validatedId = experimentIdSchema.parse(experimentId);
  const { data, error } = await getSupabase()
    .from("experiments")
    .delete()
    .eq("experiment_id", validatedId)
    .select("*")
    .returns<Tables<"experiments">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to delete experiment ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const listExperimentsForProduct = async (productId: string) => {
  const validatedProductId = identifierSchema.parse(productId);
  const { data, error } = await getSupabase()
    .from("experiments")
    .select("*")
    .eq("product_id", validatedProductId)
    .order("created_at", { ascending: false })
    .returns<Tables<"experiments">[]>();

  if (error) {
    throw new Error(
      `Failed to list experiments for product ${validatedProductId}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const listExperimentsForScript = async (scriptId: string) => {
  const validatedScriptId = identifierSchema.parse(scriptId);
  const { data, error } = await getSupabase()
    .from("experiments")
    .select("*")
    .eq("script_id", validatedScriptId)
    .returns<Tables<"experiments">[]>();

  if (error) {
    throw new Error(
      `Failed to list experiments for script ${validatedScriptId}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const listExperimentsForAsset = async (assetId: string) => {
  const validatedAssetId = identifierSchema.parse(assetId);
  const { data, error } = await getSupabase()
    .from("experiments")
    .select("*")
    .eq("asset_id", validatedAssetId)
    .returns<Tables<"experiments">[]>();

  if (error) {
    throw new Error(
      `Failed to list experiments for asset ${validatedAssetId}: ${error.message}`,
    );
  }

  return data ?? [];
};
