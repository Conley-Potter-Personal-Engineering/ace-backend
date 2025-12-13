import { uploadToS3, uploadToSupabase } from "./storageClients";

export type StorageBackend = "supabase" | "s3";

/**
 * Uploads a file buffer to the configured storage backend.
 * - For `supabase`, delegates to `uploadToSupabase`.
 * - For `s3`, delegates to `uploadToS3`.
 * On failure, throws an Error that prefixes the backend for easier debugging.
 * Throws `Error("Unsupported backend")` when an unknown backend is provided.
 */
export const storageUploader = async (
  file: Buffer,
  backend: StorageBackend,
): Promise<string> => {
  if (backend !== "supabase" && backend !== "s3") {
    throw new Error("Unsupported backend");
  }

  try {
    if (backend === "supabase") {
      return await uploadToSupabase(file);
    }

    return await uploadToS3(file);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to upload via ${backend}: ${message}`);
  }
};
