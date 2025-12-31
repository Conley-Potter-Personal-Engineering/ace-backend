import { uploadToSupabase } from "@/utils/storageClients/supabaseClient";
import { uploadToS3 } from "@/utils/storageClients/s3Client";

export type StorageBackend = "supabase" | "s3";

/**
 * Uploads a file buffer to the selected storage backend and returns its URL.
 * Delegates to Supabase or S3 clients and rethrows descriptive errors on failure.
 *
 * ✅ Uses lazy-initialized clients (avoids build-time env freezing)
 * ✅ Safe for Railway, Turbopack, and local environments
 * ✅ Clear error messages for missing configuration
 */
const DEFAULT_PATH_PREFIX = "videos";

const getDefaultKey = (): string =>
  `${DEFAULT_PATH_PREFIX}/${Date.now()}.mp4`;

const toBuffer = async (
  file: Buffer | Uint8Array | Blob | string,
): Promise<Buffer> => {
  if (Buffer.isBuffer(file)) {
    return file;
  }

  if (file instanceof Uint8Array) {
    return Buffer.from(file);
  }

  if (typeof file === "string") {
    return Buffer.from(file);
  }

  if (typeof Blob !== "undefined" && file instanceof Blob) {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error("Unsupported file type for upload");
};

export const storageUploader = async (
  file: Buffer | Uint8Array | Blob | string,
  backend: StorageBackend,
  key?: string,
  contentType?: string,
): Promise<string> => {
  try {
    switch (backend) {
      case "supabase": {
        const buffer = await toBuffer(file);
        return await uploadToSupabase(buffer, key);
      }

      case "s3": {
        const resolvedKey = key ?? getDefaultKey();
        return await uploadToS3(resolvedKey, file, contentType);
      }

      default:
        throw new Error(`Unsupported storage backend: ${backend}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to upload via ${backend}: ${message}`);
  }
};
