import { getSupabase } from "../db/db";
import type { Tables, TablesInsert, TablesUpdate } from "../db/types";
import {
  identifierSchema,
  nullableDateSchema,
  stringArraySchema,
  z,
} from "./validators";

const publishedPostInsertSchema = z.object({
    caption: z.string().trim().nullable().optional(),
    correlation_id: z.string().trim().nullable().optional(),
    created_at: nullableDateSchema,
    experiment_id: identifierSchema.nullable().optional(),
    hashtags: stringArraySchema.nullable().optional(),
    platform: z.string().min(1, "Platform is required"),
    platform_post_id: identifierSchema.nullable().optional(),
    post_id: identifierSchema.optional(),
    posted_at: nullableDateSchema,
    workflow_id: z.string().trim().nullable().optional(),
  });

const publishedPostUpdateSchema = publishedPostInsertSchema.partial();

const postIdSchema = identifierSchema.describe("post_id");

export const createPublishedPost = async (
  payload: TablesInsert<"published_posts">,
) => {
  const validated = publishedPostInsertSchema.parse(payload);
  const { data, error } = await getSupabase()
    .from("published_posts")
    .insert(validated)
    .select("*")
    .returns<Tables<"published_posts">[]>()
    .single();

  if (error) {
    throw new Error(`Failed to create published post: ${error.message}`);
  }

  return data;
};

export const listPublishedPosts = async () => {
  const { data, error } = await getSupabase()
    .from("published_posts")
    .select("*")
    .order("posted_at", { ascending: false })
    .returns<Tables<"published_posts">[]>();

  if (error) {
    throw new Error(`Failed to list published posts: ${error.message}`);
  }

  return data ?? [];
};

export interface PublishedPostFilters {
  experimentId?: string;
  platform?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Finds published posts with optional filters.
 */
export const findMany = async (filters: PublishedPostFilters) => {
  let query = getSupabase()
    .from("published_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.experimentId) {
    const validatedExperimentId = identifierSchema.parse(filters.experimentId);
    query = query.eq("experiment_id", validatedExperimentId);
  }

  if (filters.platform) {
    query = query.eq("platform", filters.platform);
  }

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate);
  }

  const { data, error } = await query.returns<Tables<"published_posts">[]>();

  if (error) {
    throw new Error(`Failed to list published posts: ${error.message}`);
  }

  return data ?? [];
};

export const getPublishedPostById = async (postId: string) => {
  const validatedId = postIdSchema.parse(postId);
  const { data, error } = await getSupabase()
    .from("published_posts")
    .select("*")
    .eq("post_id", validatedId)
    .returns<Tables<"published_posts">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch published post ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const updatePublishedPost = async (
  postId: string,
  changes: TablesUpdate<"published_posts">,
) => {
  const validatedId = postIdSchema.parse(postId);
  const validatedChanges = publishedPostUpdateSchema.parse(changes);
  const { data, error } = await getSupabase()
    .from("published_posts")
    .update(validatedChanges)
    .eq("post_id", validatedId)
    .select("*")
    .returns<Tables<"published_posts">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to update published post ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const deletePublishedPost = async (postId: string) => {
  const validatedId = postIdSchema.parse(postId);
  const { data, error } = await getSupabase()
    .from("published_posts")
    .delete()
    .eq("post_id", validatedId)
    .select("*")
    .returns<Tables<"published_posts">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to delete published post ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const listPostsForExperiment = async (experimentId: string) => {
  const validatedExperimentId = identifierSchema.parse(experimentId);
  const { data, error } = await getSupabase()
    .from("published_posts")
    .select("*")
    .eq("experiment_id", validatedExperimentId)
    .order("posted_at", { ascending: false })
    .returns<Tables<"published_posts">[]>();

  if (error) {
    throw new Error(
      `Failed to list posts for experiment ${validatedExperimentId}: ${error.message}`,
    );
  }

  return data ?? [];
};

/**
 * Lists published posts for a set of experiment ids.
 */
export const listPostsForExperimentIds = async (experimentIds: string[]) => {
  if (!experimentIds.length) {
    return [];
  }

  const { data, error } = await getSupabase()
    .from("published_posts")
    .select("*")
    .in("experiment_id", experimentIds)
    .returns<Tables<"published_posts">[]>();

  if (error) {
    throw new Error(
      `Failed to list posts for experiments: ${error.message}`,
    );
  }

  return data ?? [];
};

export const listPostsForPlatform = async (platform: string) => {
  const validatedPlatform = identifierSchema.parse(platform);
  const { data, error } = await getSupabase()
    .from("published_posts")
    .select("*")
    .eq("platform", validatedPlatform)
    .order("posted_at", { ascending: false })
    .returns<Tables<"published_posts">[]>();

  if (error) {
    throw new Error(
      `Failed to list posts for platform ${validatedPlatform}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const listRecentPublishedPosts = async (limit = 10) => {
  const validatedLimit = z.number().int().positive().parse(limit);
  const { data, error } = await getSupabase()
    .from("published_posts")
    .select("*")
    .order("posted_at", { ascending: false })
    .limit(validatedLimit)
    .returns<Tables<"published_posts">[]>();

  if (error) {
    throw new Error(`Failed to list recent posts: ${error.message}`);
  }

  return data ?? [];
};
