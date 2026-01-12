import { getSupabase } from "../db/db";
import type { Tables, TablesInsert, TablesUpdate } from "../db/types";
import {
  type ScriptInsert,
  ScriptInsertSchema,
} from "../schemas/scriptsSchema";

const mapToDbPayload = (
  payload: ScriptInsert,
): TablesInsert<"scripts"> => ({
  script_id: payload.scriptId,
  product_id: payload.productId,
  title: payload.title ?? null,
  script_text: payload.scriptText,
  hook: payload.hook,
  cta: payload.cta ?? null,
  outline: payload.outline ?? null,
  creative_variables: payload.creativeVariables,
  creative_pattern_id: payload.creativePatternId,
  trend_reference: payload.trendReference ?? null,
  created_at: payload.createdAt,
});

export type ScriptInsertPayload = ScriptInsert;

export const createScript = async (payload: ScriptInsert) => {
  ScriptInsertSchema.parse(payload);

  const { data, error } = await getSupabase()
    .from("scripts")
    .insert(mapToDbPayload(payload))
    .select("*")
    .returns<Tables<"scripts">[]>()
    .single();

  if (error) {
    throw new Error(`Failed to create script: ${error.message}`);
  }

  return data;
};

export const listScripts = async () => {
  const { data, error } = await getSupabase()
    .from("scripts")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Tables<"scripts">[]>();

  if (error) {
    throw new Error(`Failed to list scripts: ${error.message}`);
  }

  return data ?? [];
};

export const getScriptById = async (scriptId: string) => {
  const { data, error } = await getSupabase()
    .from("scripts")
    .select("*")
    .eq("script_id", scriptId)
    .returns<Tables<"scripts">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch script with id ${scriptId}: ${error.message}`);
  }

  return data;
};

export const findById = getScriptById;

export const updateScript = async (
  scriptId: string,
  changes: TablesUpdate<"scripts">,
) => {
  const { data, error } = await getSupabase()
    .from("scripts")
    .update(changes)
    .eq("script_id", scriptId)
    .select("*")
    .returns<Tables<"scripts">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update script ${scriptId}: ${error.message}`);
  }

  return data;
};

export const deleteScript = async (scriptId: string) => {
  const { data, error } = await getSupabase()
    .from("scripts")
    .delete()
    .eq("script_id", scriptId)
    .select("*")
    .returns<Tables<"scripts">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to delete script ${scriptId}: ${error.message}`);
  }

  return data;
};

export const listScriptsForProduct = async (productId: string) => {
  const { data, error } = await getSupabase()
    .from("scripts")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .returns<Tables<"scripts">[]>();

  if (error) {
    throw new Error(
      `Failed to list scripts for product ${productId}: ${error.message}`,
    );
  }

  return data ?? [];
};

export interface ScriptFilters {
  productId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Finds scripts with optional filters.
 */
export const findMany = async (filters: ScriptFilters) => {
  let query = getSupabase()
    .from("scripts")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.productId) {
    query = query.eq("product_id", filters.productId);
  }

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate);
  }

  const { data, error } = await query.returns<Tables<\"scripts\">[]>();

  if (error) {
    throw new Error(`Failed to list scripts: ${error.message}`);
  }

  return data ?? [];
};

export const searchScriptsByHook = async (hookFragment: string) => {
  const { data, error } = await getSupabase()
    .from("scripts")
    .select("*")
    .ilike("hook", `%${hookFragment}%`)
    .returns<Tables<"scripts">[]>();

  if (error) {
    throw new Error(
      `Failed to search scripts by hook ${hookFragment}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const listRecentScripts = async (limit = 10) => {
  const sanitizedLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
  const { data, error } = await getSupabase()
    .from("scripts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(sanitizedLimit)
    .returns<Tables<"scripts">[]>();

  if (error) {
    throw new Error(`Failed to list recent scripts: ${error.message}`);
  }

  return data ?? [];
};
