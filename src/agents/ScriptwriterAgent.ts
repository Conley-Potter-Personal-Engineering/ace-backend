import type { Tables } from "@/db/types";
import { scriptwriterChain } from "@/llm/chains/scriptwriterChain";
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
import BaseAgent from "./BaseAgent";

type CreativePattern = Tables<"creative_patterns">;
type TrendSnapshot = Tables<"trend_snapshots">;

export interface ScriptwriterResult {
  script: Tables<"scripts">;
  scriptId: string;
}

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

export class ScriptwriterAgent extends BaseAgent {
  constructor({ agentName = "ScriptwriterAgent" } = {}) {
    super(agentName);
  }

  async run(rawInput: unknown): Promise<ScriptwriterResult> {
    await this.logEvent("agent.start", { input: rawInput });
    await this.logEvent("script.generate.start", { input: rawInput });

    try {
      const input = ScriptWriterInput.parse(rawInput);

      const product = await productsRepo.getProductById(input.productId);
      if (!product) {
        throw new Error(`Product ${input.productId} not found`);
      }

      const [creativePatterns, trendSnapshots] = await Promise.all([
        creativePatternsRepo.listPatternsForProduct(input.productId),
        trendSnapshotsRepo.listSnapshotsForProduct(input.productId),
      ]);

      const resolvedPatternSummaries = input.patternSummaries.length
        ? input.patternSummaries
        : creativePatterns.map(summarizePattern);

      const resolvedTrendSummaries = input.trendSummaries.length
        ? input.trendSummaries
        : trendSnapshots.map(summarizeTrend);

      const chainInput: ScriptWriterInputType = {
        productId: input.productId,
        productSummary:
          input.productSummary ||
          product.description ||
          product.name ||
          "No product summary available.",
        patternSummaries: resolvedPatternSummaries,
        trendSummaries: resolvedTrendSummaries,
        creativeVariables: input.creativeVariables ?? {},
      };

      const structuredScript = ScriptOutput.parse(await scriptwriterChain(chainInput));

      const patternUsed = creativePatterns[0]?.pattern_id;
      const trendReference = trendSnapshots[0]?.snapshot_id;

      const creativeVariables = {
        ...input.creativeVariables,
        emotion: input.creativeVariables?.emotion ?? "inspiring",
        structure: input.creativeVariables?.structure ?? "problem-solution",
        style: input.creativeVariables?.style ?? "direct",
        patternUsed,
        trendReference,
      };

      const createdScript = await scriptsRepo.createScript({
        productId: input.productId,
        scriptText: formatScriptText(structuredScript),
        hook: structuredScript.hook,
        creativeVariables,
        createdAt: this.now(),
      });

      await agentNotesRepo.createAgentNote({
        agent_name: this.agentName,
        topic: "script_generation",
        content: [
          `Script generated for ${product.name ?? product.product_id}.`,
          `Pattern used: ${patternUsed ?? "none"}; Trend reference: ${trendReference ?? "none"}.`,
          `Creative variables: ${JSON.stringify(creativeVariables)}`,
          `CTA: ${structuredScript.cta}`,
        ].join("\n"),
        importance: 0.6,
        embedding: null,
        created_at: this.now(),
      });

      await this.logEvent("script.generate.success", {
        productId: input.productId,
        scriptId: createdScript.script_id,
      });
      await this.logEvent("agent.success", {
        productId: input.productId,
        scriptId: createdScript.script_id,
      });

      return { script: createdScript, scriptId: createdScript.script_id };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logEvent("script.generate.error", { message });
      await this.logEvent("agent.error", { message });
      return this.handleError("ScriptwriterAgent.run", error);
    }
  }
}

export default ScriptwriterAgent;
