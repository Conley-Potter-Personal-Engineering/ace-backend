import { describe, it, expect, vi } from "vitest";
import * as chain from "../../../src/llm/chains/scriptwriterChain";
import { generateScript } from "../../../src/services/scriptwriterService";

describe("scriptwriterService.generateScript", () => {
  it("returns validated script data", async () => {
    // Mock LangChain
    vi.spyOn(chain, "runScriptwriterChain").mockResolvedValue({
      scriptText: "Test script",
      hook: "Test hook",
      creativeVariables: {
        emotion: "calm",
        structure: "linear",
        style: "minimal"
      }
    });

    const product = { name: "Test Product", description: "desc" };
    const notes = ["note one", "note two"];

    const result = await generateScript(product, notes);

    expect(result.scriptText).toBe("Test script");
    expect(result.hook).toBe("Test hook");
  });
});
