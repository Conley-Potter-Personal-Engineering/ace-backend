import { getSupabase } from "../db/db";
import type { Tables, TablesInsert, TablesUpdate } from "../db/types";
import {
  identifierSchema,
  jsonSchema,
  nullableDateSchema,
  stringArraySchema,
  z,
} from "./validators";

const creativePatternInsertSchema = z.object({
    created_at: nullableDateSchema,
    emotion_tags: stringArraySchema.nullable().optional(),
    hook_text: z.string().trim().nullable().optional(),
    notes: z.string().trim().nullable().optional(),
    observed_performance: jsonSchema.nullable().optional(),
    pattern_id: identifierSchema.optional(),
    product_id: identifierSchema.nullable().optional(),
    structure: z.string().trim().nullable().optional(),
    style_tags: stringArraySchema.nullable().optional(),
  });

const creativePatternUpdateSchema = creativePatternInsertSchema.partial();

const patternIdSchema = identifierSchema.describe("pattern_id");

export const createCreativePattern = async (
  payload: TablesInsert<"creative_patterns">,
) => {
  const validated = creativePatternInsertSchema.parse(payload);
  const { data, error } = await getSupabase()
    .from("creative_patterns")
    .insert(validated)
    .select("*")
    .returns<Tables<"creative_patterns">[]>()
    .single();

  if (error) {
    throw new Error(`Failed to create creative pattern: ${error.message}`);
  }

  return data;
};

export const listCreativePatterns = async () => {
  const { data, error } = await getSupabase()
    .from("creative_patterns")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Tables<"creative_patterns">[]>();

  if (error) {
    throw new Error(`Failed to list creative patterns: ${error.message}`);
  }

  return data ?? [];
};

export const getCreativePatternById = async (patternId: string) => {
  const validatedId = patternIdSchema.parse(patternId);
  const { data, error } = await getSupabase()
    .from("creative_patterns")
    .select("*")
    .eq("pattern_id", validatedId)
    .returns<Tables<"creative_patterns">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch creative pattern ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const updateCreativePattern = async (
  patternId: string,
  changes: TablesUpdate<"creative_patterns">,
) => {
  const validatedId = patternIdSchema.parse(patternId);
  const validatedChanges = creativePatternUpdateSchema.parse(changes);
  const { data, error } = await getSupabase()
    .from("creative_patterns")
    .update(validatedChanges)
    .eq("pattern_id", validatedId)
    .select("*")
    .returns<Tables<"creative_patterns">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to update creative pattern ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const deleteCreativePattern = async (patternId: string) => {
  const validatedId = patternIdSchema.parse(patternId);
  const { data, error } = await getSupabase()
    .from("creative_patterns")
    .delete()
    .eq("pattern_id", validatedId)
    .select("*")
    .returns<Tables<"creative_patterns">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to delete creative pattern ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const listPatternsForProduct = async (productId: string) => {
  const validatedProductId = identifierSchema.parse(productId);
  const { data, error } = await getSupabase()
    .from("creative_patterns")
    .select("*")
    .eq("product_id", validatedProductId)
    .order("created_at", { ascending: false })
    .returns<Tables<"creative_patterns">[]>();

  if (error) {
    throw new Error(
      `Failed to list creative patterns for product ${validatedProductId}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const findPatternsByStyleTag = async (tag: string) => {
  const validatedTag = identifierSchema.parse(tag);
  const { data, error } = await getSupabase()
    .from("creative_patterns")
    .select("*")
    .contains("style_tags", [validatedTag])
    .returns<Tables<"creative_patterns">[]>();

  if (error) {
    throw new Error(
      `Failed to find creative patterns with style tag ${validatedTag}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const findPatternsByEmotionTag = async (tag: string) => {
  const validatedTag = identifierSchema.parse(tag);
  const { data, error } = await getSupabase()
    .from("creative_patterns")
    .select("*")
    .contains("emotion_tags", [validatedTag])
    .returns<Tables<"creative_patterns">[]>();

  if (error) {
    throw new Error(
      `Failed to find creative patterns with emotion tag ${validatedTag}: ${error.message}`,
    );
  }

  return data ?? [];
};
