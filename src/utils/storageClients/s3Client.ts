/**
 * S3 client for ACE
 *
 * ✅ Uses AWS SDK v3 modular import (`@aws-sdk/client-s3`)
 * ✅ Lazily initializes the client to avoid Turbopack build-time env freezing
 * ✅ Provides a helper for uploading files at runtime
 */

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

let s3Client: S3Client | null = null;

/**
 * Lazily initializes the S3 client using runtime environment variables.
 */
export function getS3Client(): S3Client {
  if (!s3Client) {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucket = process.env.AWS_S3_BUCKET;

    if (!region || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error("S3 environment variables are missing");
    }

    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return s3Client;
}

/**
 * Uploads a file to the configured S3 bucket.
 * Automatically retrieves the client at runtime.
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
