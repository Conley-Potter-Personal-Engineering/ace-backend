import BaseAgent from "./BaseAgent";
import type { Tables } from "../db/types";
import {
  createScript,
  getProductById,
  listImportantNotes,
  searchNotesByTopic,
} from "../repos";
import { scriptInputSchema } from "../schemas/scriptsSchema";
import { z } from "zod";

export interface ScriptwriterInput {
  productId: string;
  warmupNotes?: string[];
}

export interface ScriptwriterResult {
  scriptId: string;
  script: Tables<"scripts">;
}

interface ScriptDraft {
  scriptText: string;
  hook?: string;
  creativeVariables?: Record<string, unknown>;
}

const scriptwriterInputSchema = z.object({
  productId: z.string().uuid(),
  warmupNotes: z.array(z.string()).optional(),
});

export class ScriptwriterAgent extends BaseAgent {
  constructor({ agentName = "ScriptwriterAgent" } = {}) {
    super(agentName);
  }

  async run(rawInput: ScriptwriterInput): Promise<ScriptwriterResult> {
    try {
      const input = scriptwriterInputSchema.parse(rawInput);
      await this.logEvent("script.generate.start", { productId: input.productId });

      const product = await getProductById(input.productId);
      if (!product) {
        await this.logEvent("error.product_not_found", { productId: input.productId });
        throw new Error(`Product ${input.productId} not found`);
      }
      await this.logEvent("context.product_loaded", { productId: input.productId });

      const notes =
        (await searchNotesByTopic(product.name ?? input.productId)) ??
        (await listImportantNotes());
      await this.logEvent("context.notes_loaded", {
        productId: input.productId,
        notesCount: notes?.length ?? 0,
      });

      const draft = generateScript(product, notes ?? [], input.warmupNotes);
      await this.logEvent("generation.script_drafted", {
        productId: input.productId,
        hasHook: Boolean(draft.hook),
      });

      let validatedScript: z.infer<typeof scriptInputSchema>;
      try {
        validatedScript = scriptInputSchema.parse({
          productId: input.productId,
          scriptText: draft.scriptText,
          hook: draft.hook,
          creativeVariables: draft.creativeVariables,
        });
      } catch (error) {
        await this.logEvent("error.validation_failed", {
          productId: input.productId,
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }

      const created = await createScript({
        product_id: validatedScript.productId!,
        script_text: validatedScript.scriptText,
        hook: validatedScript.hook ?? null,
        creative_variables: validatedScript.creativeVariables ?? null,
        created_at: this.now(),
      });
      await this.logEvent("db.script_stored", {
        productId: input.productId,
        scriptId: created.script_id,
      });

      const note = await this.storeNote(
        "script_generation",
        `Generated script for product ${product.name ?? input.productId}`,
      );
      await this.logEvent("memory.note_stored", {
        noteId: note.note_id,
        productId: input.productId,
      });

      await this.logEvent("script.generate.success", {
        productId: input.productId,
        scriptId: created.script_id,
      });

      return { scriptId: created.script_id, script: created };
    } catch (error) {
      await this.logEvent("script.generate.error", {
        message: error instanceof Error ? error.message : String(error),
      });
      return this.handleError("ScriptwriterAgent.run", error);
    }
  }
}

export const generateScript = (
  product: Tables<"products">,
  notes: Tables<"agent_notes">[],
  warmupNotes?: string[],
): ScriptDraft => {
  const noteSummary = notes
    .map((note) => `• ${note.topic ?? "note"}: ${note.content}`)
    .join("\n");
  const warmup = warmupNotes?.length
    ? `Warmup notes: ${warmupNotes.join("; ")}.`
    : "";

  return {
    hook: `Why ${product.name} stands out`,
    scriptText: [
      `Introducing ${product.name}.`,
      product.description ?? "This product helps users solve key problems.",
      warmup,
      noteSummary ? `Insights:\n${noteSummary}` : "",
      "Call to action: tap the link to learn more!",
    ]
      .filter(Boolean)
      .join("\n\n"),
    creativeVariables: {
      productCategory: product.category ?? "general",
      sourcePlatform: product.source_platform,
      hasNotes: notes.length > 0,
    },
  };
};

export default ScriptwriterAgent;
