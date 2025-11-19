import type { Tables } from "../db/types";
import { runScriptwriterChain } from "../llm/chains/scriptwriterChain";
import { scriptInsertSchema, type ScriptInsertDTO } from "../schemas/scriptsSchema";

export async function generateScript(
  product: Tables<"products">,
  notes: Tables<"agent_notes">[],
): Promise<ScriptInsertDTO> {
  const chainResult = await runScriptwriterChain({ product, notes });

  const scriptPayload: ScriptInsertDTO = scriptInsertSchema.parse({
    productId: product.product_id,
    scriptText: chainResult.scriptText,
    hook: chainResult.hook,
    creativeVariables: chainResult.creativeVariables,
  });

  return scriptPayload;
}
