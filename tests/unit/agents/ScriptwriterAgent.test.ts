import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScriptwriterAgent } from "@/agents/ScriptwriterAgent";
import * as agentNotesRepo from "@/repos/agentNotes";
import * as creativePatternsRepo from "@/repos/creativePatterns";
import * as productsRepo from "@/repos/products";
import * as scriptsRepo from "@/repos/scripts";
import * as trendSnapshotsRepo from "@/repos/trendSnapshots";
import { scriptwriterChain } from "@/llm/chains/scriptwriterChain";

vi.mock("@/repos/products", () => ({
  getProductById: vi.fn(),
}));

vi.mock("@/repos/creativePatterns", () => ({
  getCreativePatternById: vi.fn(),
  listPatternsForProduct: vi.fn(),
}));

vi.mock("@/repos/trendSnapshots", () => ({
  getTrendSnapshotById: vi.fn(),
  getLatestSnapshotForProduct: vi.fn(),
  listSnapshotsForProduct: vi.fn(),
}));

vi.mock("@/repos/scripts", () => ({
  createScript: vi.fn(),
}));

vi.mock("@/repos/agentNotes", () => ({
  createAgentNote: vi.fn(),
}));

vi.mock("@/llm/chains/scriptwriterChain", () => ({
  scriptwriterChain: vi.fn(),
  ScriptwriterChainError: class ScriptwriterChainError extends Error {},
}));

describe("ScriptwriterAgent", () => {
  const fixedNow = "2024-01-01T00:00:00.000Z";
  const baseInput = {
    productId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    creativePatternId: "8c76f6dd-44c3-4d4c-9c28-0d2b6c4c1e62",
    trendSnapshotId: "2b6f0c45-cf59-4f43-b88b-8b7e0c8f44ef",
  };

  const mockPattern = {
    pattern_id: "8c76f6dd-44c3-4d4c-9c28-0d2b6c4c1e62",
    structure: "Story arc",
    style_tags: ["casual", "direct"],
    emotion_tags: ["excited"],
    hook_text: "Open with the big reveal",
  } as const;

  const mockTrend = {
    snapshot_id: "2b6f0c45-cf59-4f43-b88b-8b7e0c8f44ef",
    tiktok_trend_tags: ["tag-a", "tag-b"],
    velocity_score: 0.82,
    popularity_score: 0.91,
  } as const;

  const structuredScript = {
    title: "Great Script",
    hook: "Big hook",
    cta: "Click now",
    outline: ["Setup", "Payoff"],
    body: "Full script body.",
  } as const;

  const expectedScriptText = [
    structuredScript.title,
    "",
    `Hook: ${structuredScript.hook}`,
    "",
    "Outline:",
    "1. Setup\n2. Payoff",
    "",
    structuredScript.body,
    "",
    `CTA: ${structuredScript.cta}`,
  ].join("\n");

  let agent: ScriptwriterAgent;
  let eventCalls: Array<{ eventType: string; payload?: Record<string, unknown> }>;

  beforeEach(() => {
    agent = new ScriptwriterAgent({ agentName: "ScriptwriterAgentTest" });
    eventCalls = [];

    vi.spyOn(agent as unknown as { now: () => string }, "now").mockReturnValue(fixedNow);
    vi.spyOn(agent as unknown as { logEvent: (type: string, payload?: Record<string, unknown>) => Promise<void> }, "logEvent").mockImplementation(
      async (eventType, payload) => {
        eventCalls.push({ eventType, payload });
      },
    );

    vi.mocked(productsRepo.getProductById).mockResolvedValue({
      product_id: baseInput.productId,
      name: "Test Product",
      description: "A compelling product description.",
      brand: "TestBrand",
      category: "testing",
      price_usd: 29.99,
      currency: "USD",
      target_audience: "Health-conscious adults",
      primary_benefit: "Saves time",
      content_brief: "Focus on convenience angle",
      status: "active",
      key_features: ["feature1", "feature2"],
      objections: ["objection1"],
      demo_ideas: ["demo1"],
      meta: { compliance: ["No medical claims"] },
    } as any);

    vi.mocked(creativePatternsRepo.getCreativePatternById).mockResolvedValue(
      mockPattern as any,
    );
    vi.mocked(trendSnapshotsRepo.getTrendSnapshotById).mockResolvedValue(mockTrend as any);
    vi.mocked(scriptwriterChain).mockResolvedValue(structuredScript);

    vi.mocked(scriptsRepo.createScript).mockResolvedValue({
      script_id: "script-123",
      product_id: baseInput.productId,
      script_text: expectedScriptText,
      hook: structuredScript.hook,
      creative_pattern_id: baseInput.creativePatternId,
      trend_reference: mockTrend.snapshot_id,
      created_at: fixedNow,
    } as any);

    vi.mocked(agentNotesRepo.createAgentNote).mockResolvedValue({
      agent_note_id: "note-123",
      agent_name: "ScriptwriterAgentTest",
      topic: "script_generation",
      content: "Generated script",
      created_at: fixedNow,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits success events and stores the generated script", async () => {
    const result = await agent.run(baseInput);

    expect(productsRepo.getProductById).toHaveBeenCalledWith(baseInput.productId);
    expect(creativePatternsRepo.getCreativePatternById).toHaveBeenCalledWith(
      baseInput.creativePatternId,
    );
    expect(trendSnapshotsRepo.getTrendSnapshotById).toHaveBeenCalledWith(
      baseInput.trendSnapshotId,
    );

    expect(scriptwriterChain).toHaveBeenCalledWith({
      product: expect.objectContaining({
        product_id: baseInput.productId,
      }),
      pattern: mockPattern,
      trend: mockTrend,
    });

    expect(scriptsRepo.createScript).toHaveBeenCalledWith({
      productId: baseInput.productId,
      scriptText: expectedScriptText,
      hook: structuredScript.hook,
      creativeVariables: expect.objectContaining({
        emotion: "excited",
        structure: "Story arc",
        style: "casual",
      }),
      creativePatternId: baseInput.creativePatternId,
      trendReference: mockTrend.snapshot_id,
      createdAt: fixedNow,
    });

    expect(agentNotesRepo.createAgentNote).toHaveBeenCalledWith(
      expect.objectContaining({
        agent_name: "ScriptwriterAgentTest",
        topic: "script_generation",
      }),
    );

    expect(eventCalls.map(({ eventType }) => eventType)).toEqual([
      "agent.start",
      "script.generate.start",
      "script.generate.success",
      "agent.success",
    ]);

    expect(result).toEqual({
      script: expect.objectContaining({ script_id: "script-123" }),
      scriptId: "script-123",
    });
  });

  it("logs errors and rethrows when the LLM chain fails", async () => {
    const failure = new Error("LLM unavailable");
    vi.mocked(scriptwriterChain).mockRejectedValueOnce(failure);

    await expect(agent.run(baseInput)).rejects.toThrow("LLM unavailable");

    expect(scriptsRepo.createScript).not.toHaveBeenCalled();
    expect(agentNotesRepo.createAgentNote).not.toHaveBeenCalled();

    const emitted = eventCalls.map(({ eventType }) => eventType);
    expect(emitted).toEqual([
      "agent.start",
      "script.generate.start",
      "script.generate.error",
      "agent.error",
      "error",
    ]);
  });

  it("fails fast on invalid input before calling repos or LLM chain", async () => {
    const invalidInput = { productId: "" };

    await expect(agent.run(invalidInput)).rejects.toThrow();

    expect(productsRepo.getProductById).not.toHaveBeenCalled();
    expect(creativePatternsRepo.getCreativePatternById).not.toHaveBeenCalled();
    expect(trendSnapshotsRepo.getTrendSnapshotById).not.toHaveBeenCalled();
    expect(scriptwriterChain).not.toHaveBeenCalled();
    expect(scriptsRepo.createScript).not.toHaveBeenCalled();

    const emitted = eventCalls.map(({ eventType }) => eventType);
    expect(emitted).toEqual([
      "agent.start",
      "script.generate.start",
      "script.generate.error",
      "agent.error",
      "error",
    ]);
  });
});
