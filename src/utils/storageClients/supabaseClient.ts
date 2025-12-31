/**
 * Supabase client initialized lazily to avoid Turbopack build-time variable freezing.
 * This ensures process.env values are read only at runtime in Next.js 16+.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error("Supabase environment variables are missing");
    }

    supabase = createClient(url, key);
  }

  return supabase;
};
const BUCKET_NAME = "video-assets";
const DEFAULT_PATH_PREFIX = "videos";

/**
 * Uploads a file buffer to Supabase Storage and returns an accessible URL.
 * Uses `videos/<timestamp>.mp4` as the default path when none is provided.
 * Attempts to generate a signed URL for the uploaded file; if signing fails, returns a public URL if available.
 * Throws descriptive errors for any failures during upload or URL generation.
 */
export const uploadToSupabase = async (
  file: Buffer,
  path: string = `${DEFAULT_PATH_PREFIX}/${Date.now()}.mp4`,
): Promise<string> => {
  try {
    const supabase = getSupabaseClient();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        contentType: "video/mp4",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 60 * 60);

    if (signedError) {
      const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);

      if (!publicData?.publicUrl) {
        throw new Error(`Signed URL generation failed: ${signedError.message}`);
      }

      return publicData.publicUrl;
    }

    if (!signedData?.signedUrl) {
      throw new Error("Signed URL generation returned no URL");
    }

    return signedData.signedUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Supabase upload error: ${message}`);
  }
};
