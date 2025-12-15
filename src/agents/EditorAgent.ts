import editorChain, {
  type EditorChainInvocationOutput,
} from "@/llm/chains/editorChain";
import * as scriptsRepo from "@/repos/scripts";
import * as video_assetsRepo from "@/repos/videoAssets";
import {
  EditorRequestSchema,
  editorChainOutputSchema,
  type EditorRequest,
  type VideoAsset,
} from "@/schemas/editorSchemas";
import { storageUploader } from "@/utils/storageUploader";
import type { Tables } from "@/db/types";
import BaseAgent from "./BaseAgent";

export interface EditorAgentResult {
  asset: VideoAsset;
  metadata: EditorChainInvocationOutput["metadata"];
  persistedAsset: Tables<"video_assets">;
  storageUrl: string;
}

export class EditorAgent extends BaseAgent {
  constructor({ agentName = "EditorAgent" } = {}) {
    super(agentName);
  }

  async run(rawInput: unknown): Promise<EditorAgentResult> {
    await this.logEvent("agent.start", { input: rawInput });
    await this.logEvent("video.render.start", { input: rawInput });

    try {
      const input = EditorRequestSchema.parse(rawInput);

      const script = await scriptsRepo.findById(input.scriptId);
      if (!script) {
        throw new Error(`Script ${input.scriptId} not found`);
      }

      await this.logEvent("context.script_loaded", {
        scriptId: script.script_id,
        productId: script.product_id,
      });

      const chainResult = await editorChain(
        script.script_text ?? "",
        input.composition,
        input.styleTemplateId,
      );

      const validatedChain = editorChainOutputSchema.parse({
        storagePath: chainResult.storagePath,
        durationSeconds: chainResult.durationSeconds,
        thumbnailPath: chainResult.thumbnailPath,
        metadata: chainResult.metadata,
      });

      const mockVideo =
        chainResult.mockVideo ??
        JSON.stringify({
          scriptId: input.scriptId,
          composition: input.composition,
          metadata: validatedChain.metadata,
        });

      const storageUrl = await this.uploadWithRetry(
        Buffer.from(mockVideo),
        input.renderBackend,
        input.scriptId,
      );

      const styleTags = this.deriveStyleTags(chainResult.styleTags, input.styleTemplateId);

      const { asset, record } = await video_assetsRepo.create({
        scriptId: input.scriptId,
        storageUrl,
        duration: Math.round(
          validatedChain.durationSeconds ?? input.composition.duration,
        ),
        tone: input.composition.tone,
        layout: input.composition.layout,
        styleTags,
      });

      await this.logEvent("video.assets.uploaded", {
        scriptId: input.scriptId,
        storageUrl,
        backend: input.renderBackend,
      });

      await this.logEvent("video.assets.created", {
        assetId: record.asset_id,
        scriptId: input.scriptId,
        storagePath: record.storage_path,
        durationSeconds: record.duration_seconds,
      });

      await this.logEvent("video.render.success", {
        scriptId: input.scriptId,
        assetId: record.asset_id,
        storageUrl,
        styleTags,
        duration: asset.duration,
      });
      await this.logEvent("agent.success", {
        scriptId: input.scriptId,
        assetId: record.asset_id,
      });

      return {
        asset,
        metadata: validatedChain.metadata,
        persistedAsset: record,
        storageUrl,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logEvent("video.render.error", {
        scriptId: (rawInput as Record<string, unknown> | null)?.scriptId ?? null,
        message,
      });
      await this.logEvent("agent.error", {
        scriptId: (rawInput as Record<string, unknown> | null)?.scriptId ?? null,
        message,
      });
      return this.handleError("EditorAgent.run", error);
    }
  }

  private deriveStyleTags(
    chainStyleTags: string[] | undefined,
    styleTemplateId: string | undefined,
  ): string[] {
    if (chainStyleTags?.length) {
      return chainStyleTags;
    }

    return styleTemplateId ? [styleTemplateId] : [];
  }

  private resolveBackend(
    backend: EditorRequest["renderBackend"],
  ): "supabase" | "s3" {
    return backend === "local" ? "supabase" : backend;
  }

  private async uploadWithRetry(
    file: Buffer,
    backend: EditorRequest["renderBackend"],
    scriptId: string,
  ): Promise<string> {
    const maxAttempts = 3;
    const baseDelayMs = 500;
    let attempt = 0;

    while (attempt < maxAttempts) {
      try {
        return await storageUploader(file, this.resolveBackend(backend));
      } catch (error) {
        attempt += 1;
        const message = error instanceof Error ? error.message : String(error);

        if (attempt >= maxAttempts) {
          throw new Error(`Upload failed after ${attempt} attempts: ${message}`);
        }

        await this.logEvent("system.retry", {
          scriptId,
          backend,
          attempt,
          message,
        });

        const delay = baseDelayMs * 2 ** (attempt - 1);
        await this.sleep(delay);
      }
    }

    throw new Error("Upload retry logic exhausted unexpectedly");
  }
}

export default EditorAgent;
