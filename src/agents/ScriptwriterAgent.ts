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
  ScriptOutput,
  ScriptWriterInput,
  type ScriptOutputType,
  type ScriptWriterInputType,
} from "@/schemas/scriptwriterSchemas";
import { ZodError } from "zod";
import BaseAgent from "./BaseAgent";

type CreativePattern = Tables<"creative_patterns">;
type TrendSnapshot = Tables<"trend_snapshots">;
type Product = Tables<"products">;
type CreativeVariables = {
  emotion: string;
  structure: string;
  style: string;
  [key: string]: unknown;
};

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
  pattern,
  trend,
}: {
  pattern?: CreativePattern | null;
  trend?: TrendSnapshot | null;
}): CreativeVariables => ({
  emotion: pickFirst(pattern?.emotion_tags, "inspiring"),
  structure: pattern?.structure ?? "problem-solution",
  style: pickFirst(pattern?.style_tags, "direct"),
  patternUsed: pattern?.pattern_id ?? null,
  trendReference: trend?.snapshot_id ?? null,
});

export class ScriptwriterAgent extends BaseAgent {
  constructor({ agentName = "ScriptwriterAgent" } = {}) {
    super(agentName);
  }

  async run(rawInput: unknown): Promise<ScriptwriterResult> {
    const baseContext = this.extractWorkflowContext(rawInput);
    await this.logEvent("agent.start", { ...baseContext, input: rawInput });
    await this.logEvent("script.generate.start", { ...baseContext, input: rawInput });

    try {
      const validatedInput = ScriptWriterInput.parse(rawInput);
      const execution = await this.generateFromInput(validatedInput);

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
    const summaryParse = ScriptWriterInput.safeParse(rawInput);
    if (summaryParse.success) {
      return {
        workflow_id: null,
        correlation_id: null,
        productId: summaryParse.data.productId,
        patternId: summaryParse.data.creativePatternId,
        trendSnapshotId: summaryParse.data.trendSnapshotId,
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

  private async generateFromInput(
    input: ScriptWriterInputType,
  ): Promise<{ result: ScriptwriterResult; context: WorkflowContext }> {
    const product = await this.ensureProduct(input.productId);

    const [patternUsed, trendReference] = await Promise.all([
      creativePatternsRepo.getCreativePatternById(input.creativePatternId),
      trendSnapshotsRepo.getTrendSnapshotById(input.trendSnapshotId),
    ]);

    if (!patternUsed) {
      throw new ScriptwriterAgentError(
        `Creative pattern ${input.creativePatternId} not found`,
        "NOT_FOUND",
      );
    }

    if (!trendReference) {
      throw new ScriptwriterAgentError(
        `Trend snapshot ${input.trendSnapshotId} not found`,
        "NOT_FOUND",
      );
    }

    const structuredScript = await this.runScriptwriterChain({
      product,
      pattern: patternUsed,
      trend: trendReference,
    });

    const creativeVariables = buildCreativeVariables({
      pattern: patternUsed,
      trend: trendReference,
    });

    const createdScript = await this.persistScript({
      productId: input.productId,
      structuredScript,
      creativeVariables,
      creativePatternId: patternUsed?.pattern_id ?? input.creativePatternId,
      trendReference: trendReference?.snapshot_id ?? input.trendSnapshotId,
    });

    try {
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
    } catch (noteError) {
      await this.logEvent("agent.note.error", {
        message:
          noteError instanceof Error ? noteError.message : String(noteError),
      });
    }

    return {
      result: createdScript,
      context: {
        workflow_id: null,
        correlation_id: null,
        productId: input.productId,
        patternId: patternUsed?.pattern_id ?? null,
        trendSnapshotId: trendReference?.snapshot_id ?? null,
      },
    };
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
    creativePatternId,
    trendReference,
  }: {
    productId: string;
    structuredScript: ScriptOutputType;
    creativeVariables: CreativeVariables;
    creativePatternId: string | null;
    trendReference: string | null;
  }): Promise<ScriptwriterResult> {
    try {
      const createdScript = await scriptsRepo.createScript({
        productId,
        title: structuredScript.title,
        scriptText: formatScriptText(structuredScript),
        hook: structuredScript.hook,
        cta: structuredScript.cta,
        outline: structuredScript.outline.join("\n"),
        creativeVariables,
        creativePatternId,
        trendReference,
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
