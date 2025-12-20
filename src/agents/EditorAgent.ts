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
import generateVideoFromPlan from "@/utils/videoGenerationHelper";
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

    let renderPlanPrepared = false;
    let agentErrorLogged = false;

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

      const styleTags = this.deriveStyleTags(chainResult.styleTags, input.styleTemplateId);
      const renderPlan = {
        title: validatedChain.metadata.title,
        tone: input.composition.tone,
        layout: input.composition.layout,
        duration: validatedChain.durationSeconds ?? input.composition.duration,
        styleTags,
      };

      renderPlanPrepared = true;

      await this.logEvent("video.render.success", {
        scriptId: input.scriptId,
        storagePath: validatedChain.storagePath,
        duration: renderPlan.duration,
        styleTags,
        metadata: validatedChain.metadata,
      });

      let videoBuffer: Buffer | null = null;
      let generationMetadata: { duration: number; format: string; size: number } | null = null;

      try {
        await this.logEvent("video.generate.start", {
          scriptId: input.scriptId,
          tone: renderPlan.tone,
          layout: renderPlan.layout,
        });

        const generationResult = await generateVideoFromPlan(renderPlan);
        videoBuffer = generationResult.buffer;
        generationMetadata = generationResult.metadata;

        await this.logEvent("video.generate.success", {
          scriptId: input.scriptId,
          duration: generationMetadata.duration,
          size: generationMetadata.size,
          format: generationMetadata.format,
        });
      } catch (generationError) {
        const message =
          generationError instanceof Error ? generationError.message : String(generationError);
        await this.logEvent("video.generate.error", {
          scriptId: input.scriptId,
          message,
        });
        await this.logEvent("agent.error", {
          scriptId: input.scriptId,
          message,
        });
        agentErrorLogged = true;
        throw generationError;
      }

      if (!videoBuffer || !generationMetadata) {
        throw new Error("Video generation failed: Missing video buffer or metadata");
      }

      const storageUrl = await this.uploadWithRetry(
        videoBuffer,
        input.renderBackend,
        input.scriptId,
      );

      const { asset, record } = await video_assetsRepo.create({
        scriptId: input.scriptId,
        storageUrl,
        duration: generationMetadata.duration,
        tone: renderPlan.tone,
        layout: renderPlan.layout,
        styleTags: renderPlan.styleTags,
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
      const scriptId = (rawInput as Record<string, unknown> | null)?.scriptId ?? null;

      if (!renderPlanPrepared) {
        await this.logEvent("video.render.error", {
          scriptId,
          message,
        });
      }

      if (!agentErrorLogged) {
        await this.logEvent("agent.error", {
          scriptId,
          message,
        });
      }
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
