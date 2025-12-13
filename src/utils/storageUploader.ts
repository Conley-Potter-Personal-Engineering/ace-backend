import { uploadToSupabase } from "@/utils/storageClients/supabaseClient";
import { uploadToS3 } from "@/utils/storageClients/s3Client";

export type StorageBackend = "supabase" | "s3";

/**
 * Uploads a file buffer to the selected storage backend and returns its URL.
 * Delegates to Supabase or S3 clients and rethrows descriptive errors on failure.
 */
export const storageUploader = async (
  file: Buffer,
  backend: StorageBackend,
): Promise<string> => {
  try {
    switch (backend) {
      case "supabase":
        return await uploadToSupabase(file);
      case "s3":
        return await uploadToS3(file);
      default:
        throw new Error("Unsupported backend");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to upload via ${backend}: ${message}`);
  }
};
