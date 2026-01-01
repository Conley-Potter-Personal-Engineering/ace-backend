import editorChain, {
  type EditorChainInvocationOutput,
} from "@/llm/chains/editorChain";
import * as scriptsRepo from "@/repos/scripts";
import * as storageRepo from "@/repos/storage";
import * as videoAssetsRepo from "@/repos/videoAssets";
import {
  EditorRequestSchema,
  EditorChainOutputSchema,
  type EditorChainOutput,
  type EditorRequest,
  StyleTemplateSchema,
  type StyleTemplate,
  VideoAssetSchema,
  type VideoAsset,
} from "@/schemas/editorSchemas";
import generateVideoWithVeo from "@/utils/veoVideoGenerator";
import type { Tables } from "@/db/types";
import BaseAgent, { type BaseAgentConfig } from "./BaseAgent";
import { ZodError } from "zod";

export interface EditorAgentResult {
  asset: VideoAsset;
  metadata: EditorChainInvocationOutput["metadata"];
  persistedAsset: Tables<"video_assets">;
  storageUrl: string;
}

export interface EditorAgentConfig extends BaseAgentConfig {
  styleTemplates?: Record<string, unknown>;
  defaultStorageBackend?: "supabase" | "s3";
}

export type EditorAgentErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "CHAIN_FAILED"
  | "RENDER_FAILED"
  | "UPLOAD_FAILED"
  | "PERSISTENCE"
  | "UNKNOWN";

export class EditorAgentError extends Error {
  code: EditorAgentErrorCode;
  cause?: unknown;

  constructor(
    message: string,
    code: EditorAgentErrorCode = "UNKNOWN",
    cause?: unknown,
  ) {
    super(message);
    this.name = "EditorAgentError";
    this.code = code;
    this.cause = cause;
  }
}

export interface EditorAgentInit extends EditorAgentConfig {
  agentName?: string;
}

export class EditorAgent extends BaseAgent {
  constructor({ agentName = "EditorAgent", ...config }: EditorAgentInit = {}) {
    super(agentName, config);
  }

  async run(rawInput: unknown): Promise<EditorAgentResult> {
    const baseContext = this.extractWorkflowContext(rawInput);
    await this.logEvent("agent.start", { ...baseContext, input: rawInput });
    await this.logEvent("video.render.start", { ...baseContext, input: rawInput });

    try {
      const input = EditorRequestSchema.parse(rawInput);
      const styleTemplate = this.resolveStyleTemplate(input);

      const script = await scriptsRepo.findById(input.scriptId);
      if (!script) {
        throw new EditorAgentError(
          `Script ${input.scriptId} not found`,
          "NOT_FOUND",
        );
      }

      await this.logEvent("context.script_loaded", {
        ...baseContext,
        scriptId: script.script_id,
        productId: script.product_id,
      });

      const chainResult = await this.runEditorChain({
        scriptText: script.script_text ?? "",
        composition: input.composition,
        styleTemplateId: input.styleTemplateId,
      });

      const validatedChain = this.parseChainOutput(chainResult);

      const styleTags = this.deriveStyleTags({
        chainStyleTags: chainResult.styleTags,
        styleTemplateId: input.styleTemplateId,
        styleTemplate,
      });
      const renderPlan = {
        title: validatedChain.metadata.title,
        scriptSummary: validatedChain.metadata.summary,
        tone: input.composition.tone,
        layout: input.composition.layout,
        duration: validatedChain.durationSeconds ?? input.composition.duration,
        styleTags,
      };

      await this.logEvent("video.render.progress", {
        ...baseContext,
        scriptId: input.scriptId,
        stage: "plan_ready",
        duration: renderPlan.duration,
        styleTags,
      });

      const generationResult = await this.generateVideo({
        renderPlan,
        scriptId: input.scriptId,
        styleTemplate,
      });

      await this.logEvent("video.render.progress", {
        ...baseContext,
        scriptId: input.scriptId,
        stage: "generated",
        duration: generationResult.metadata.duration ?? renderPlan.duration,
      });

      const resolvedBackend = this.resolveStorageBackend(input.renderBackend);
      const uploadResult = await this.uploadRenderedVideo({
        buffer: generationResult.buffer,
        backend: resolvedBackend,
        storagePath: validatedChain.storagePath,
      });

      const storageUrl = uploadResult.url;

      await this.logEvent("video.assets.uploaded", {
        ...baseContext,
        scriptId: input.scriptId,
        storageUrl,
        backend: uploadResult.backend,
        attempts: uploadResult.attempts,
      });

      await this.logEvent("video.render.success", {
        ...baseContext,
        scriptId: input.scriptId,
        storagePath: validatedChain.storagePath,
        duration: generationResult.metadata.duration ?? renderPlan.duration,
        styleTags,
        storageUrl,
      });

      const assetPayload = VideoAssetSchema.parse({
        scriptId: input.scriptId,
        storageUrl,
        duration: generationResult.metadata.duration ?? renderPlan.duration,
        tone: renderPlan.tone,
        layout: renderPlan.layout,
        styleTags: renderPlan.styleTags,
      });

      const { asset, record } = await this.persistVideoAsset(assetPayload);

      await this.logEvent("video.assets.created", {
        ...baseContext,
        assetId: record.asset_id,
        scriptId: input.scriptId,
        storagePath: record.storage_path,
        durationSeconds: record.duration_seconds,
      });

      await this.logEvent("agent.success", {
        ...baseContext,
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
      const normalizedError = this.normalizeError(error);
      await this.logEvent("video.render.error", {
        ...baseContext,
        message: normalizedError.message,
        code: normalizedError.code,
      });
      await this.logEvent("agent.error", {
        ...baseContext,
        message: normalizedError.message,
        code: normalizedError.code,
      });
      return this.handleError("EditorAgent.run", normalizedError);
    }
  }

  private deriveStyleTags(
    params: {
      chainStyleTags: string[] | undefined;
      styleTemplateId: string | undefined;
      styleTemplate: StyleTemplate | null;
    },
  ): string[] {
    if (params.chainStyleTags?.length) {
      return params.chainStyleTags;
    }

    if (params.styleTemplate?.name) {
      return [params.styleTemplate.name];
    }

    return params.styleTemplateId ? [params.styleTemplateId] : [];
  }

  private resolveStyleTemplate(input: EditorRequest): StyleTemplate | null {
    if (input.styleTemplate) {
      if (
        input.styleTemplateId &&
        input.styleTemplateId !== input.styleTemplate.name
      ) {
        throw new EditorAgentError(
          "styleTemplateId must match styleTemplate.name when both are provided",
          "VALIDATION",
        );
      }
      return input.styleTemplate;
    }

    const templates = (this.config as EditorAgentConfig).styleTemplates;
    if (
      input.styleTemplateId &&
      templates &&
      typeof templates === "object" &&
      input.styleTemplateId in templates
    ) {
      const candidate = (templates as Record<string, unknown>)[
        input.styleTemplateId
      ];
      return StyleTemplateSchema.parse(candidate);
    }

    return null;
  }

  private resolveStorageBackend(
    backend: EditorRequest["renderBackend"],
  ): storageRepo.StorageUploadBackend {
    if (backend !== "local") {
      return backend;
    }

    if ((this.config as EditorAgentConfig).defaultStorageBackend === "s3") {
      return "s3";
    }

    return "supabase";
  }

  private formatStyleTemplate(styleTemplate: StyleTemplate): string {
    const transitions = styleTemplate.transitions.length
      ? `Transitions: ${styleTemplate.transitions.join(", ")}.`
      : "Transitions: none.";
    const brandingBits = [
      styleTemplate.branding?.logoUrl
        ? `Logo: ${styleTemplate.branding.logoUrl}.`
        : null,
      styleTemplate.branding?.watermarkText
        ? `Watermark: ${styleTemplate.branding.watermarkText}.`
        : null,
    ].filter(Boolean);
    const branding =
      brandingBits.length > 0 ? `Branding: ${brandingBits.join(" ")}` : "";
    return [
      `Style template "${styleTemplate.name}".`,
      `Colors: primary ${styleTemplate.colors.primary}, secondary ${styleTemplate.colors.secondary}, background ${styleTemplate.colors.background}.`,
      `Fonts: title ${styleTemplate.fonts.title}, body ${styleTemplate.fonts.body}.`,
      transitions,
      branding,
    ]
      .filter((part) => part.length > 0)
      .join(" ");
  }

  private buildVideoPrompt({
    renderPlan,
    styleTemplate,
  }: {
    renderPlan: {
      title: string;
      scriptSummary: string;
      tone: string;
      layout: string;
      duration: number;
    };
    styleTemplate: StyleTemplate | null;
  }): string {
    const basePrompt = `Generate a ${renderPlan.duration}-second ${renderPlan.tone} video in ${renderPlan.layout} layout about: ${
      renderPlan.scriptSummary || renderPlan.title
    }.`;
    if (!styleTemplate) {
      return basePrompt;
    }

    return `${basePrompt} ${this.formatStyleTemplate(styleTemplate)}`;
  }

  private async generateVideo({
    renderPlan,
    scriptId,
    styleTemplate,
  }: {
    renderPlan: {
      title: string;
      scriptSummary: string;
      tone: string;
      layout: string;
      duration: number;
    };
    scriptId: string;
    styleTemplate: StyleTemplate | null;
  }): Promise<{ buffer: Buffer; metadata: { duration?: number; format: string } }> {
    await this.logEvent("video.generate.start", {
      scriptId,
      tone: renderPlan.tone,
      layout: renderPlan.layout,
      duration: renderPlan.duration,
    });

    try {
      const prompt = this.buildVideoPrompt({ renderPlan, styleTemplate });
      const generationResult = await generateVideoWithVeo(prompt, {
        duration: renderPlan.duration,
      });

      await this.logEvent("video.generate.success", {
        scriptId,
        duration: generationResult.metadata.duration,
        size: generationResult.buffer.length,
        format: generationResult.metadata.format,
      });

      return generationResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logEvent("video.generate.error", {
        scriptId,
        message,
      });
      throw new EditorAgentError(message, "RENDER_FAILED", error);
    }
  }

  private async runEditorChain({
    scriptText,
    composition,
    styleTemplateId,
  }: {
    scriptText: string;
    composition: EditorRequest["composition"];
    styleTemplateId?: string;
  }): Promise<EditorChainInvocationOutput> {
    try {
      return await editorChain(scriptText, composition, styleTemplateId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new EditorAgentError(message, "CHAIN_FAILED", error);
    }
  }

  private parseChainOutput(
    output: EditorChainInvocationOutput,
  ): EditorChainOutput {
    try {
      return EditorChainOutputSchema.parse({
        storagePath: output.storagePath,
        durationSeconds: output.durationSeconds,
        thumbnailPath: output.thumbnailPath,
        metadata: output.metadata,
      });
    } catch (error) {
      throw new EditorAgentError(
        "Editor chain output failed validation.",
        "CHAIN_FAILED",
        error,
      );
    }
  }

  private async uploadRenderedVideo({
    buffer,
    backend,
    storagePath,
  }: {
    buffer: Buffer;
    backend: storageRepo.StorageUploadBackend;
    storagePath: string;
  }): Promise<storageRepo.UploadRenderedVideoResult> {
    try {
      return await storageRepo.uploadRenderedVideo({
        file: buffer,
        backend,
        key: storagePath,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new EditorAgentError(message, "UPLOAD_FAILED", error);
    }
  }

  private async persistVideoAsset(
    payload: VideoAsset,
  ): Promise<videoAssetsRepo.CreatedVideoAsset> {
    try {
      return await videoAssetsRepo.create(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new EditorAgentError(message, "PERSISTENCE", error);
    }
  }

  private extractWorkflowContext(rawInput: unknown): {
    scriptId: string | null;
    styleTemplateId: string | null;
  } {
    const parsed = EditorRequestSchema.safeParse(rawInput);
    if (parsed.success) {
      return {
        scriptId: parsed.data.scriptId,
        styleTemplateId: parsed.data.styleTemplateId ?? null,
      };
    }

    return {
      scriptId: null,
      styleTemplateId: null,
    };
  }

  private normalizeError(error: unknown): EditorAgentError {
    if (error instanceof EditorAgentError) {
      return error;
    }

    if (error instanceof ZodError) {
      return new EditorAgentError(
        "Editor input failed validation.",
        "VALIDATION",
        error,
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    return new EditorAgentError(message, "UNKNOWN", error);
  }
}

export default EditorAgent;
