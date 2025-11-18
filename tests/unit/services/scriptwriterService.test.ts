import { describe, expect, it, vi } from "vitest";

vi.mock("../../../src/llm/chains/scriptwriterChain", () => ({
  runScriptwriterChain: vi.fn(),
}));

import * as chain from "../../../src/llm/chains/scriptwriterChain";
import { generateScript } from "../../../src/services/scriptwriterService";
import { buildAgentNote } from "../../utils/factories/agentNoteFactory";
import { buildProduct } from "../../utils/factories/productFactory";

describe("scriptwriterService.generateScript", () => {
  it("returns a validated ScriptInsertDTO", async () => {
    vi.spyOn(chain, "runScriptwriterChain").mockResolvedValue({
      scriptText: "Test script",
      hook: "Test hook",
      creativeVariables: {
        emotion: "calm",
        structure: "linear",
        style: "minimal",
      },
    });

    const product = buildProduct();
    const notes = [buildAgentNote(), buildAgentNote({ topic: "warmup" })];

    const result = await generateScript(product, notes);

    expect(result).toEqual({
      productId: product.product_id,
      scriptText: "Test script",
      hook: "Test hook",
      creativeVariables: {
        emotion: "calm",
        structure: "linear",
        style: "minimal",
      },
    });
  });

  it("rejects malformed chain outputs", async () => {
    vi.spyOn(chain, "runScriptwriterChain").mockResolvedValue({
      scriptText: "",
      hook: "",
      creativeVariables: { emotion: "", structure: "", style: "" },
    });

    await expect(generateScript(buildProduct(), [])).rejects.toThrow();
  });
});
