import BaseAgent from "./BaseAgent";
import type { Tables } from "../db/types";
import {
  createScript,
  getProductById,
  listImportantNotes,
  searchNotesByTopic,
} from "../repos";
import { generateScript } from "../services/scriptwriterService";
import { z } from "zod";

export interface ScriptwriterInput {
  productId: string;
  warmupNotes?: string[];
}

export interface ScriptwriterResult {
  scriptId: string;
  script: Tables<"scripts">;
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

      const scriptDTO = await generateScript(product, notes ?? []);
      await this.logEvent("generation.script_drafted", {
        productId: input.productId,
        hasHook: Boolean(scriptDTO.hook),
      });

      const created = await createScript({
        ...scriptDTO,
        createdAt: this.now(),
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

export default ScriptwriterAgent;
