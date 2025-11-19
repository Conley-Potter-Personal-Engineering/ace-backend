import { getSupabase } from "../db/db";
import type { Tables, TablesInsert, TablesUpdate } from "../db/types";
import { identifierSchema, jsonSchema, nullableDateSchema, z } from "./validators";

const embeddingInsertSchema = z.object({
  created_at: nullableDateSchema,
  embedding: z.string().min(1, "Embedding vector is required"),
  embedding_id: identifierSchema.optional(),
  metadata: jsonSchema.nullable().optional(),
  reference_id: identifierSchema,
  reference_type: z.string().min(1, "Reference type is required"),
});

const embeddingUpdateSchema = embeddingInsertSchema.partial();

const embeddingIdSchema = identifierSchema.describe("embedding_id");

export const createEmbedding = async (payload: TablesInsert<"embeddings">) => {
  const validated = embeddingInsertSchema.parse(payload);
  const { data, error } = await getSupabase()
    .from("embeddings")
    .insert(validated)
    .select("*")
    .returns<Tables<"embeddings">[]>()
    .single();

  if (error) {
    throw new Error(`Failed to create embedding: ${error.message}`);
  }

  return data;
};

export const listEmbeddings = async () => {
  const { data, error } = await getSupabase()
    .from("embeddings")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Tables<"embeddings">[]>();

  if (error) {
    throw new Error(`Failed to list embeddings: ${error.message}`);
  }

  return data ?? [];
};

export const getEmbeddingById = async (embeddingId: string) => {
  const validatedId = embeddingIdSchema.parse(embeddingId);
  const { data, error } = await getSupabase()
    .from("embeddings")
    .select("*")
    .eq("embedding_id", validatedId)
    .returns<Tables<"embeddings">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch embedding ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const updateEmbedding = async (
  embeddingId: string,
  changes: TablesUpdate<"embeddings">,
) => {
  const validatedId = embeddingIdSchema.parse(embeddingId);
  const validatedChanges = embeddingUpdateSchema.parse(changes);
  const { data, error } = await getSupabase()
    .from("embeddings")
    .update(validatedChanges)
    .eq("embedding_id", validatedId)
    .select("*")
    .returns<Tables<"embeddings">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update embedding ${validatedId}: ${error.message}`);
  }

  return data;
};

export const deleteEmbedding = async (embeddingId: string) => {
  const validatedId = embeddingIdSchema.parse(embeddingId);
  const { data, error } = await getSupabase()
    .from("embeddings")
    .delete()
    .eq("embedding_id", validatedId)
    .select("*")
    .returns<Tables<"embeddings">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to delete embedding ${validatedId}: ${error.message}`);
  }

  return data;
};

export const listEmbeddingsForReference = async (
  referenceId: string,
  referenceType?: string,
) => {
  const validatedReferenceId = identifierSchema.parse(referenceId);
  const query = getSupabase()
    .from("embeddings")
    .select("*")
    .eq("reference_id", validatedReferenceId);

  const filteredQuery = referenceType
    ? query.eq("reference_type", identifierSchema.parse(referenceType))
    : query;

  const { data, error } = await filteredQuery.returns<Tables<"embeddings">[]>();

  if (error) {
    throw new Error(
      `Failed to list embeddings for reference ${validatedReferenceId}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const listEmbeddingsByType = async (referenceType: string) => {
  const validatedType = identifierSchema.parse(referenceType);
  const { data, error } = await getSupabase()
    .from("embeddings")
    .select("*")
    .eq("reference_type", validatedType)
    .returns<Tables<"embeddings">[]>();

  if (error) {
    throw new Error(
      `Failed to list embeddings for type ${validatedType}: ${error.message}`,
    );
  }

  return data ?? [];
};
