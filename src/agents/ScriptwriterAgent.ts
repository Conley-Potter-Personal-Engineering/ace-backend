import type { Tables } from "@/db/types";
import { scriptwriterChain } from "@/llm/chains/scriptwriterChain";
import * as agentNotesRepo from "@/repos/agentNotes";
import * as creativePatternsRepo from "@/repos/creativePatterns";
import * as productsRepo from "@/repos/products";
import * as scriptsRepo from "@/repos/scripts";
import * as trendSnapshotsRepo from "@/repos/trendSnapshots";
import { scriptwriterAgentInputSchema } from "@/schemas/agentSchemas";
import {
  ScriptOutput,
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
      const input = scriptwriterAgentInputSchema.parse(rawInput);

      const product = await productsRepo.getProductById(input.productId);
      if (!product) {
        throw new Error(`Product ${input.productId} not found`);
      }

      const [creativePattern, trendSnapshots] = await Promise.all([
        creativePatternsRepo.getCreativePatternById(input.creativePatternId),
        trendSnapshotsRepo.listSnapshotsForProduct(input.productId),
      ]);

      if (!creativePattern) {
        throw new Error(`Creative pattern ${input.creativePatternId} not found`);
      }

      const resolvedPatternSummary = summarizePattern(creativePattern);
      const resolvedTrendSnapshots = input.trendSnapshotIds.length
        ? trendSnapshots.filter((snapshot) =>
            input.trendSnapshotIds.includes(snapshot.snapshot_id),
          )
        : trendSnapshots;

      const chainInput: ScriptWriterInputType = {
        productId: input.productId,
        productSummary:
          input.productSummary ||
          product.description ||
          product.name ||
          "No product summary available.",
        creativePatternId: input.creativePatternId,
        trendSummaries: resolvedTrendSnapshots.map(summarizeTrend),
      };

      const structuredScript = ScriptOutput.parse(await scriptwriterChain(chainInput));

      const patternUsed = creativePattern.pattern_id;
      const trendReference = resolvedTrendSnapshots[0]?.snapshot_id;

      const createdScript = await scriptsRepo.createScript({
        productId: input.productId,
        scriptText: formatScriptText(structuredScript),
        hook: structuredScript.hook,
        creativePatternId: input.creativePatternId,
        trendReference,
        createdAt: this.now(),
      });

      await agentNotesRepo.createAgentNote({
        agent_name: this.agentName,
        topic: "script_generation",
        content: [
          `Script generated for ${product.name ?? product.product_id}.`,
          resolvedPatternSummary,
          `Pattern used: ${patternUsed ?? "none"}; Trend reference: ${trendReference ?? "none"}.`,
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
