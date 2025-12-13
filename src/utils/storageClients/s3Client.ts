import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const { AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_REGION } =
  process.env;

if (!AWS_S3_BUCKET_NAME || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_REGION) {
  throw new Error("S3 environment variables are missing");
}

const s3Client = new S3Client({
  region: AWS_S3_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const DEFAULT_KEY_PREFIX = "videos";

/**
 * Uploads a file buffer to S3 and returns a public URL.
 * Uses `videos/<timestamp>.mp4` as the default object key when none is provided.
 * Uploads with `public-read` ACL to ensure accessibility.
 * Throws descriptive errors when upload fails.
 */
export const uploadToS3 = async (
  file: Buffer,
  key: string = `${DEFAULT_KEY_PREFIX}/${Date.now()}.mp4`,
): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
      Body: file,
      ACL: "public-read",
      ContentType: "video/mp4",
    });

    await s3Client.send(command);

    return `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`S3 upload error: ${message}`);
  }
};
