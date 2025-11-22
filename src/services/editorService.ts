import type { Tables } from "../db/types";
import {
  runEditorChain,
  type EditorChainResult,
} from "../llm/chains/editorChain";
import { createVideoAsset } from "../repos";
import { videoAssetInputSchema } from "../schemas/videosSchema";

export interface RenderedAssetResult {
  asset: Tables<"video_assets">;
  metadata: EditorChainResult["metadata"];
}

interface RenderVideoAssetParams {
  script: Tables<"scripts">;
  overrideStoragePath?: string;
}

const defaultStoragePathForScript = (scriptId: string): string =>
  `videos/rendered/${scriptId}.mp4`;

export async function renderVideoAsset({
  script,
  overrideStoragePath,
}: RenderVideoAssetParams): Promise<RenderedAssetResult> {
  const chainResult = await runEditorChain({
    scriptText: script.script_text ?? "",
    hook: script.hook ?? "",
    creativeVariables: script.creative_variables ?? null,
    storagePathHint: overrideStoragePath ?? defaultStoragePathForScript(script.script_id),
  });

  const validatedAsset = videoAssetInputSchema.parse({
    storagePath: chainResult.storagePath,
    scriptId: script.script_id,
    durationSeconds: chainResult.durationSeconds,
    thumbnailPath: chainResult.thumbnailPath,
  });

  const created = await createVideoAsset({
    storage_path: validatedAsset.storagePath,
    script_id: validatedAsset.scriptId ?? null,
    duration_seconds: validatedAsset.durationSeconds ?? null,
    thumbnail_path: validatedAsset.thumbnailPath ?? null,
    created_at: new Date().toISOString(),
  });

  return {
    asset: created,
    metadata: chainResult.metadata,
  };
}
