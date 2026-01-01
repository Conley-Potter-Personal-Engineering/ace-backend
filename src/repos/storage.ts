import { storageUploader, type StorageBackend } from "@/utils/storageUploader";

export type StorageUploadBackend = StorageBackend | "local";

export interface UploadRenderedVideoInput {
  file: Buffer | Uint8Array | Blob | string;
  backend?: StorageUploadBackend;
  key?: string;
  contentType?: string;
  maxAttempts?: number;
  baseDelayMs?: number;
}

export interface UploadRenderedVideoResult {
  url: string;
  backend: StorageBackend;
  attempts: number;
}

const resolveBackend = (backend?: StorageUploadBackend): StorageBackend => {
  if (!backend || backend === "local") {
    return "supabase";
  }

  if (backend === "s3" || backend === "supabase") {
    return backend;
  }

  throw new Error(`Unsupported storage backend: ${String(backend)}`);
};

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const uploadRenderedVideo = async ({
  file,
  backend,
  key,
  contentType = "video/mp4",
  maxAttempts = 3,
  baseDelayMs = 500,
}: UploadRenderedVideoInput): Promise<UploadRenderedVideoResult> => {
  if (!file) {
    throw new Error("Upload failed: missing file buffer");
  }

  const resolvedBackend = resolveBackend(backend);
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt += 1;

    try {
      const url = await storageUploader(file, resolvedBackend, key, contentType);
      return { url, backend: resolvedBackend, attempts: attempt };
    } catch (error) {
      if (attempt >= maxAttempts) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Upload failed after ${attempt} attempts: ${message}`);
      }

      const delay = baseDelayMs * 2 ** (attempt - 1);
      await sleep(delay);
    }
  }

  throw new Error("Upload retry logic exhausted unexpectedly");
};
