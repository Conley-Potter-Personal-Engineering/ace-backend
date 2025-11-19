import { describe, expect, it, vi } from "vitest";
import { ScriptwriterAgent } from "../../../src/agents/ScriptwriterAgent";
import { buildAgentNote } from "../../utils/factories/agentNoteFactory";
import { buildProduct } from "../../utils/factories/productFactory";
import { buildScript } from "../../utils/factories/scriptFactory";

vi.mock("../../../src/repos/systemEvents", () => ({
  logSystemEvent: vi.fn(async ({ event_type }) => ({
    event_id: "event-id",
    agent_name: "ScriptwriterAgent",
    event_type,
    payload: null,
    created_at: new Date().toISOString(),
  })),
}));

const mockNote = buildAgentNote();
const mockProduct = buildProduct();
const mockScript = buildScript({ product_id: mockProduct.product_id });

vi.mock("../../../src/repos/agentNotes", () => ({
  createAgentNote: vi.fn(async () => mockNote),
}));

vi.mock("../../../src/repos", () => ({
  createScript: vi.fn(async () => mockScript),
  getProductById: vi.fn(async () => mockProduct),
  listImportantNotes: vi.fn(async () => []),
  searchNotesByTopic: vi.fn(async () => [mockNote]),
}));

vi.mock("../../../src/services/scriptwriterService", () => ({
  generateScript: vi.fn(async () => ({
    productId: mockProduct.product_id,
    scriptText: mockScript.script_text,
    hook: mockScript.hook,
    creativeVariables: mockScript.creative_variables,
  })),
}));

const { logSystemEvent } = await import("../../../src/repos/systemEvents");
const { createScript, getProductById, searchNotesByTopic } = await import(
  "../../../src/repos"
);

const { generateScript } = await import(
  "../../../src/services/scriptwriterService"
);

describe("ScriptwriterAgent", () => {
  it("orchestrates generation and persistence via execute()", async () => {
    const agentName = "ScriptwriterAgentTest";
    const agent = new ScriptwriterAgent({ agentName });

    const result = await agent.execute({
      productId: mockProduct.product_id,
      warmupNotes: ["script_generation"],
    });

    expect(generateScript).toHaveBeenCalledWith(mockProduct, [mockNote]);
    expect(searchNotesByTopic).toHaveBeenCalledWith(mockProduct.name);
    expect(getProductById).toHaveBeenCalledWith(mockProduct.product_id);
    expect(createScript).toHaveBeenCalled();

    const loggedEvents = vi.mocked(logSystemEvent).mock.calls.map(
      ([payload]) => payload.event_type,
    );
    expect(loggedEvents).toContain("start");
    expect(loggedEvents).toContain("script.generate.start");
    expect(loggedEvents).toContain("script.generate.success");

    expect(result).toEqual({
      scriptId: mockScript.script_id,
      script: mockScript,
    });
  });
});
