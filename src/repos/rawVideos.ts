import { getSupabase } from "../db/db";
import type { Tables, TablesInsert, TablesUpdate } from "../db/types";
import {
  identifierSchema,
  nullableDateSchema,
  stringArraySchema,
  z,
} from "./validators";

const rawVideoInsertSchema = z.object({
  author: z.string().trim().nullable().optional(),
  caption: z.string().trim().nullable().optional(),
  collected_at: nullableDateSchema,
  comment_count: z.number().nullable().optional(),
  created_at: nullableDateSchema,
  external_id: z.string().min(1, "External id is required"),
  hashtags: stringArraySchema.nullable().optional(),
  id: identifierSchema.optional(),
  like_count: z.number().nullable().optional(),
  platform: z.string().min(1, "Platform is required"),
  share_count: z.number().nullable().optional(),
  view_count: z.number().nullable().optional(),
});

const rawVideoUpdateSchema = rawVideoInsertSchema.partial();

const rawVideoIdSchema = identifierSchema.describe("id");

export const createRawVideo = async (payload: TablesInsert<"raw_videos">) => {
  const validated = rawVideoInsertSchema.parse(payload);
  const { data, error } = await getSupabase()
    .from("raw_videos")
    .insert(validated)
    .select("*")
    .returns<Tables<"raw_videos">[]>()
    .single();

  if (error) {
    throw new Error(`Failed to create raw video: ${error.message}`);
  }

  return data;
};

export const listRawVideos = async () => {
  const { data, error } = await getSupabase()
    .from("raw_videos")
    .select("*")
    .order("collected_at", { ascending: false })
    .returns<Tables<"raw_videos">[]>();

  if (error) {
    throw new Error(`Failed to list raw videos: ${error.message}`);
  }

  return data ?? [];
};

export const getRawVideoById = async (id: string) => {
  const validatedId = rawVideoIdSchema.parse(id);
  const { data, error } = await getSupabase()
    .from("raw_videos")
    .select("*")
    .eq("id", validatedId)
    .returns<Tables<"raw_videos">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch raw video ${validatedId}: ${error.message}`);
  }

  return data;
};

export const updateRawVideo = async (
  id: string,
  changes: TablesUpdate<"raw_videos">,
) => {
  const validatedId = rawVideoIdSchema.parse(id);
  const validatedChanges = rawVideoUpdateSchema.parse(changes);
  const { data, error } = await getSupabase()
    .from("raw_videos")
    .update(validatedChanges)
    .eq("id", validatedId)
    .select("*")
    .returns<Tables<"raw_videos">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update raw video ${validatedId}: ${error.message}`);
  }

  return data;
};

export const deleteRawVideo = async (id: string) => {
  const validatedId = rawVideoIdSchema.parse(id);
  const { data, error } = await getSupabase()
    .from("raw_videos")
    .delete()
    .eq("id", validatedId)
    .select("*")
    .returns<Tables<"raw_videos">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to delete raw video ${validatedId}: ${error.message}`);
  }

  return data;
};

export const listRawVideosByPlatform = async (platform: string) => {
  const validatedPlatform = identifierSchema.parse(platform);
  const { data, error } = await getSupabase()
    .from("raw_videos")
    .select("*")
    .eq("platform", validatedPlatform)
    .order("collected_at", { ascending: false })
    .returns<Tables<"raw_videos">[]>();

  if (error) {
    throw new Error(
      `Failed to list raw videos for platform ${validatedPlatform}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const listRawVideosByAuthor = async (author: string) => {
  const validatedAuthor = identifierSchema.parse(author);
  const { data, error } = await getSupabase()
    .from("raw_videos")
    .select("*")
    .eq("author", validatedAuthor)
    .returns<Tables<"raw_videos">[]>();

  if (error) {
    throw new Error(
      `Failed to list raw videos for author ${validatedAuthor}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const listRecentRawVideos = async (limit = 20) => {
  const validatedLimit = z.number().int().positive().parse(limit);
  const { data, error } = await getSupabase()
    .from("raw_videos")
    .select("*")
    .order("collected_at", { ascending: false })
    .limit(validatedLimit)
    .returns<Tables<"raw_videos">[]>();

  if (error) {
    throw new Error(`Failed to list recent raw videos: ${error.message}`);
  }

  return data ?? [];
};
