import type { Tables } from "@/db/types";
import {
  ScriptwriterChainError,
  scriptwriterChain,
  type ScriptwriterChainInput,
} from "@/llm/chains/scriptwriterChain";
import * as agentNotesRepo from "@/repos/agentNotes";
import * as creativePatternsRepo from "@/repos/creativePatterns";
import * as productsRepo from "@/repos/products";
import * as scriptsRepo from "@/repos/scripts";
import * as trendSnapshotsRepo from "@/repos/trendSnapshots";
import {
  ScriptRequestSchema,
  ScriptwriterAgentInputSchema,
  type ScriptRequest,
  type ScriptwriterAgentInput,
} from "@/schemas/agentSchemas";
import {
  ScriptOutput,
  ScriptWriterInput,
  type ScriptOutputType,
  type ScriptWriterInputType,
} from "@/schemas/scriptwriterSchemas";
import { randomUUID } from "crypto";
import { ZodError } from "zod";
import BaseAgent from "./BaseAgent";

type CreativePattern = Tables<"creative_patterns">;
type TrendSnapshot = Tables<"trend_snapshots">;
type Product = Tables<"products">;

export interface ScriptwriterResult {
  script: Tables<"scripts">;
  scriptId: string;
}

export type ScriptwriterAgentErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "CHAIN_FAILED"
  | "PERSISTENCE"
  | "UNKNOWN";

export class ScriptwriterAgentError extends Error {
  code: ScriptwriterAgentErrorCode;
  cause?: unknown;

  constructor(
    message: string,
    code: ScriptwriterAgentErrorCode = "UNKNOWN",
    cause?: unknown,
  ) {
    super(message);
    this.name = "ScriptwriterAgentError";
    this.code = code;
    this.cause = cause;
  }
}

interface WorkflowContext {
  workflow_id: string | null;
  correlation_id: string | null;
  productId: string | null;
  patternId: string | null;
  trendSnapshotId: string | null;
}

type ScriptwriterResolvedInput =
  | { type: "entity"; payload: ScriptRequest }
  | { type: "summary"; payload: ScriptWriterInputType }
  | { type: "legacy"; payload: ScriptwriterAgentInput };

const summarizePattern = (pattern: CreativePattern): string => {
  const style = (pattern.style_tags ?? []).join(", ") || "no style tags";
  const emotion = (pattern.emotion_tags ?? []).join(", ") || "no emotion tags";
  const structure = pattern.structure ?? "unspecified structure";
  const hook = pattern.hook_text ?? "no hook provided";

  return `Pattern ${pattern.pattern_id}: structure=${structure}; style=${style}; emotion=${emotion}; hook="${hook}"`;
};

const summarizeTrend = (snapshot: TrendSnapshot): string => {
  const tags = (snapshot.tiktok_trend_tags ?? []).join(", ") || "no tags";
  const velocity = snapshot.velocity_score ?? "n/a";
  const popularity = snapshot.popularity_score ?? "n/a";

  return `Trend ${snapshot.snapshot_id}: tags=${tags}; velocity=${velocity}; popularity=${popularity}`;
};

const formatScriptText = (output: ScriptOutputType): string => {
  const outline = output.outline.length
    ? output.outline.map((beat, index) => `${index + 1}. ${beat}`).join("\n")
    : "No outline provided.";

  return [
    output.title,
    "",
    `Hook: ${output.hook}`,
    "",
    "Outline:",
    outline,
    "",
    output.body,
    "",
    `CTA: ${output.cta}`,
  ].join("\n");
};

const pickFirst = (values: string[] | null | undefined, fallback: string): string =>
  values && values.length ? values[0] : fallback;

const buildCreativeVariables = ({
  baseVariables,
  pattern,
  trend,
}: {
  baseVariables?: Record<string, string>;
  pattern?: CreativePattern | null;
  trend?: TrendSnapshot | null;
}): Record<string, unknown> => {
  const base = baseVariables ?? {};
  const emotion = base.emotion ?? pickFirst(pattern?.emotion_tags, "inspiring");
  const structure = base.structure ?? pattern?.structure ?? "problem-solution";
  const style = base.style ?? pickFirst(pattern?.style_tags, "direct");

  return {
    ...base,
    emotion,
    structure,
    style,
    patternUsed: pattern?.pattern_id ?? null,
    trendReference: trend?.snapshot_id ?? null,
  };
};

export class ScriptwriterAgent extends BaseAgent {
  constructor({ agentName = "ScriptwriterAgent" } = {}) {
    super(agentName);
  }

  async run(rawInput: unknown): Promise<ScriptwriterResult> {
    const baseContext = this.extractWorkflowContext(rawInput);
    await this.logEvent("agent.start", { ...baseContext, input: rawInput });
    await this.logEvent("script.generate.start", { ...baseContext, input: rawInput });

    try {
      const resolvedInput = this.resolveInput(rawInput);
      const execution =
        resolvedInput.type === "entity"
          ? await this.generateFromEntityInput(resolvedInput.payload, baseContext)
          : await this.generateFromSummaryInput(resolvedInput.payload);

      const successContext = execution.context;

      await this.logEvent("script.generate.success", {
        ...successContext,
        scriptId: execution.result.scriptId,
      });
      await this.logEvent("agent.success", {
        ...successContext,
        scriptId: execution.result.scriptId,
      });

      return execution.result;
    } catch (error) {
      const normalizedError = this.normalizeError(error);
      await this.logEvent("script.generate.error", {
        ...baseContext,
        message: normalizedError.message,
        code: normalizedError.code,
      });
      await this.logEvent("agent.error", {
        ...baseContext,
        message: normalizedError.message,
        code: normalizedError.code,
      });
      return this.handleError("ScriptwriterAgent.run", normalizedError);
    }
  }

  private extractWorkflowContext(rawInput: unknown): WorkflowContext {
    const requestParse = ScriptRequestSchema.safeParse(rawInput);
    if (requestParse.success) {
      const correlationId = requestParse.data.correlation_id ?? randomUUID();
      return {
        workflow_id: requestParse.data.workflow_id,
        correlation_id: correlationId,
        productId: requestParse.data.product.product_id,
        patternId: requestParse.data.pattern?.pattern_id ?? null,
        trendSnapshotId: requestParse.data.trend?.snapshot_id ?? null,
      };
    }

    const summaryParse = ScriptWriterInput.safeParse(rawInput);
    if (summaryParse.success) {
      return {
        workflow_id: null,
        correlation_id: null,
        productId: summaryParse.data.productId,
        patternId: null,
        trendSnapshotId: null,
      };
    }

    const legacyParse = ScriptwriterAgentInputSchema.safeParse(rawInput);
    if (legacyParse.success) {
      return {
        workflow_id: null,
        correlation_id: null,
        productId: legacyParse.data.productId,
        patternId: null,
        trendSnapshotId: null,
      };
    }

    return {
      workflow_id: null,
      correlation_id: null,
      productId: null,
      patternId: null,
      trendSnapshotId: null,
    };
  }

  private resolveInput(rawInput: unknown): ScriptwriterResolvedInput {
    const requestParse = ScriptRequestSchema.safeParse(rawInput);
    if (requestParse.success) {
      return { type: "entity", payload: requestParse.data };
    }

    const summaryParse = ScriptWriterInput.safeParse(rawInput);
    if (summaryParse.success) {
      return { type: "summary", payload: summaryParse.data };
    }

    const legacyParse = ScriptwriterAgentInputSchema.safeParse(rawInput);
    if (legacyParse.success) {
      return { type: "legacy", payload: legacyParse.data };
    }

    throw new ScriptwriterAgentError(
      "Scriptwriter input failed validation.",
      "VALIDATION",
      summaryParse.error,
    );
  }

  private normalizeError(error: unknown): ScriptwriterAgentError {
    if (error instanceof ScriptwriterAgentError) {
      return error;
    }

    if (error instanceof ZodError) {
      return new ScriptwriterAgentError(
        "Scriptwriter input failed validation.",
        "VALIDATION",
        error,
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    return new ScriptwriterAgentError(message, "UNKNOWN", error);
  }

  private async generateFromEntityInput(
    payload: ScriptRequest,
    baseContext?: WorkflowContext,
  ): Promise<{ result: ScriptwriterResult; context: WorkflowContext }> {
    const correlationId =
      payload.correlation_id ?? baseContext?.correlation_id ?? randomUUID();
    const context: WorkflowContext = {
      workflow_id: payload.workflow_id,
      correlation_id: correlationId,
      productId: payload.product.product_id,
      patternId: payload.pattern?.pattern_id ?? null,
      trendSnapshotId: payload.trend?.snapshot_id ?? null,
    };

    const product = await this.ensureProduct(payload.product.product_id);

    const structuredScript = await this.runScriptwriterChain({
      product: payload.product,
      pattern: payload.pattern,
      trend: payload.trend,
    });

    const creativeVariables = buildCreativeVariables({
      pattern: payload.pattern,
      trend: payload.trend,
    });

    const createdScript = await this.persistScript({
      productId: product.product_id,
      structuredScript,
      creativeVariables,
    });

    await agentNotesRepo.createAgentNote({
      agent_name: this.agentName,
      topic: "script_generation_rationale",
      content: [
        `Script generated for ${product.name ?? product.product_id}.`,
        `Pattern used: ${payload.pattern?.pattern_id ?? "none"}; Trend reference: ${
          payload.trend?.snapshot_id ?? "none"
        }.`,
        `Creative variables: ${JSON.stringify(creativeVariables)}`,
        `CTA: ${structuredScript.cta}`,
      ].join("\n"),
      importance: 0.7,
      embedding: null,
      created_at: this.now(),
    });

    return { result: createdScript, context };
  }

  private async generateFromSummaryInput(
    payload: ScriptWriterInputType | ScriptwriterAgentInput,
  ): Promise<{ result: ScriptwriterResult; context: WorkflowContext }> {
    const summaryInput = await this.normalizeSummaryInput(payload);
    const product = await this.ensureProduct(summaryInput.productId);

    const [creativePatterns, trendSnapshots] = await Promise.all([
      creativePatternsRepo.listPatternsForProduct(summaryInput.productId),
      trendSnapshotsRepo.listSnapshotsForProduct(summaryInput.productId),
    ]);

    const resolvedPatternSummaries = summaryInput.patternSummaries.length
      ? summaryInput.patternSummaries
      : creativePatterns.map(summarizePattern);

    const resolvedTrendSummaries = summaryInput.trendSummaries.length
      ? summaryInput.trendSummaries
      : trendSnapshots.map(summarizeTrend);

    const chainInput: ScriptWriterInputType = {
      productId: summaryInput.productId,
      productSummary:
        summaryInput.productSummary ||
        product.description ||
        product.name ||
        "No product summary available.",
      patternSummaries: resolvedPatternSummaries,
      trendSummaries: resolvedTrendSummaries,
      creativeVariables: summaryInput.creativeVariables ?? {},
    };

    const structuredScript = await this.runScriptwriterChain(chainInput);

    const patternUsed = creativePatterns[0] ?? null;
    const trendReference = trendSnapshots[0] ?? null;

    const creativeVariables = buildCreativeVariables({
      baseVariables: summaryInput.creativeVariables,
      pattern: patternUsed,
      trend: trendReference,
    });

    const createdScript = await this.persistScript({
      productId: summaryInput.productId,
      structuredScript,
      creativeVariables,
    });

    await agentNotesRepo.createAgentNote({
      agent_name: this.agentName,
      topic: "script_generation",
      content: [
        `Script generated for ${product.name ?? product.product_id}.`,
        `Pattern used: ${patternUsed?.pattern_id ?? "none"}; Trend reference: ${
          trendReference?.snapshot_id ?? "none"
        }.`,
        `Creative variables: ${JSON.stringify(creativeVariables)}`,
        `CTA: ${structuredScript.cta}`,
      ].join("\n"),
      importance: 0.6,
      embedding: null,
      created_at: this.now(),
    });

    return {
      result: createdScript,
      context: {
        workflow_id: null,
        correlation_id: null,
        productId: summaryInput.productId,
        patternId: patternUsed?.pattern_id ?? null,
        trendSnapshotId: trendReference?.snapshot_id ?? null,
      },
    };
  }

  private async normalizeSummaryInput(
    payload: ScriptWriterInputType | ScriptwriterAgentInput,
  ): Promise<ScriptWriterInputType> {
    if ("productSummary" in payload) {
      return payload;
    }

    const product = await this.ensureProduct(payload.productId);
    const warmupNotes = payload.warmupNotes?.filter(Boolean) ?? [];

    return ScriptWriterInput.parse({
      productId: payload.productId,
      productSummary:
        product.description || product.name || "No product summary available.",
      patternSummaries: [],
      trendSummaries: [],
      creativeVariables: warmupNotes.length
        ? { warmupNotes: warmupNotes.join(" | ") }
        : {},
    });
  }

  private async ensureProduct(productId: string): Promise<Product> {
    const product = await productsRepo.getProductById(productId);
    if (!product) {
      throw new ScriptwriterAgentError(
        `Product ${productId} not found`,
        "NOT_FOUND",
      );
    }
    return product;
  }

  private async runScriptwriterChain(
    input: ScriptwriterChainInput,
  ): Promise<ScriptOutputType> {
    try {
      const output = await scriptwriterChain(input);
      return ScriptOutput.parse(output);
    } catch (error) {
      if (error instanceof ScriptwriterAgentError) {
        throw error;
      }
      if (error instanceof ScriptwriterChainError || error instanceof ZodError) {
        throw new ScriptwriterAgentError(
          error instanceof Error ? error.message : "Scriptwriter chain failed.",
          "CHAIN_FAILED",
          error,
        );
      }
      throw new ScriptwriterAgentError(
        error instanceof Error ? error.message : "Scriptwriter chain failed.",
        "CHAIN_FAILED",
        error,
      );
    }
  }

  private async persistScript({
    productId,
    structuredScript,
    creativeVariables,
  }: {
    productId: string;
    structuredScript: ScriptOutputType;
    creativeVariables: Record<string, unknown>;
  }): Promise<ScriptwriterResult> {
    try {
      const createdScript = await scriptsRepo.createScript({
        productId,
        scriptText: formatScriptText(structuredScript),
        hook: structuredScript.hook,
        creativeVariables,
        createdAt: this.now(),
      });

      return { script: createdScript, scriptId: createdScript.script_id };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ScriptwriterAgentError(message, "PERSISTENCE", error);
    }
  }
}

export default ScriptwriterAgent;
