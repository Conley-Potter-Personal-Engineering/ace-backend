## Overview
Supabase and S3 act as interchangeable storage backends used by `storageUploader.ts`. Supabase is the default for local/dev (Phase I), and S3 becomes the primary backend in Phase II as we scale.

## Directory Structure
src/utils/storageClients/
├── supabaseClient.ts
├── s3Client.ts
└── README.md

## Environment Variables
**Supabase**
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
- SUPABASE_STORAGE_BUCKET (default: video-assets)

**S3**
- AWS_REGION
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- S3_BUCKET (default: ace-video-assets)

## Usage
Both clients expose async upload helpers:
- `uploadToSupabase(file: Buffer, path?: string): Promise<string>`
- `uploadToS3(file: Buffer, key?: string): Promise<string>`

These are called internally by `storageUploader(file, backend)` and return a public or signed URL.

## Testing Strategy
- Unit tests mock these functions entirely.
- Integration tests use local stubs or preconfigured test buckets.
- No test should perform real network uploads in CI.

## Migration Plan
- Phase I: default backend = "supabase"
- Phase II: switch default to "s3"
- Phase III+: support CDN caching + signed URLs

## Security Notes
- Never commit access keys.
- Use environment variables or platform secrets.
- Do not log raw file contents.

## Example (Manual Test)
```ts
import { uploadToSupabase } from "@/utils/storageClients/supabaseClient";

const url = await uploadToSupabase(Buffer.from("hello world"));
console.log("Uploaded to:", url);
```
