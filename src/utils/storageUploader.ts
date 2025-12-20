/**
 * Storage uploader utility for ACE
 *
 * ✅ Uses modular AWS SDK v3 (`@aws-sdk/client-s3`)
 * ✅ Integrates with the lazy-initialized S3 client (getS3Client)
 * ✅ Avoids accessing environment variables at module load
 */

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getS3Client } from "./storageClients/s3Client";

/**
 * Uploads a file buffer to the configured S3 bucket.
 *
 * @param key - The destination key/path in the bucket
 * @param body - The file contents (Buffer, string, etc.)
 * @param contentType - Optional MIME type for the file
 * @returns The public URL of the uploaded file
 */
export async function uploadToS3(
  key: string,
  body: Buffer | Uint8Array | Blob | string,
  contentType?: string
): Promise<string> {
  const client = getS3Client();
  const bucket = process.env.AWS_S3_BUCKET;

  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is not defined in environment");
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType || "application/octet-stream",
  });

  await client.send(command);

  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Uploads JSON data as an object to S3.
 *
 * @param key - The object key/path in the bucket
 * @param data - The JSON data to upload
 * @returns The public URL of the uploaded object
 */
export async function uploadJSONToS3(key: string, data: any): Promise<string> {
  const jsonBody = JSON.stringify(data, null, 2);
  return uploadToS3(key, jsonBody, "application/json");
}

/**
 * Uploads text content to S3.
 *
 * @param key - The destination key
 * @param text - The text to upload
 * @returns The public URL of the uploaded text file
 */
export async function uploadTextToS3(key: string, text: string): Promise<string> {
  return uploadToS3(key, text, "text/plain");
}
