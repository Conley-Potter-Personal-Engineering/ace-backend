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
  listPatternsForProduct: vi.fn(),
}));

vi.mock("@/repos/trendSnapshots", () => ({
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
}));

describe("ScriptwriterAgent", () => {
  const fixedNow = "2024-01-01T00:00:00.000Z";
  const baseInput = {
    productId: "product-123",
    productSummary: "A compelling product description.",
    trendSummaries: [],
    patternSummaries: [],
    creativeVariables: { tone: "witty" },
  };

  const mockPattern = {
    pattern_id: "pattern-1",
    structure: "Story arc",
    style_tags: ["casual", "direct"],
    emotion_tags: ["excited"],
    hook_text: "Open with the big reveal",
  } as const;

  const mockTrend = {
    snapshot_id: "trend-1",
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

  const expectedCreativeVariables = {
    ...baseInput.creativeVariables,
    emotion: "inspiring",
    structure: "problem-solution",
    style: "direct",
    patternUsed: mockPattern.pattern_id,
    trendReference: mockTrend.snapshot_id,
  };

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
      description: baseInput.productSummary,
    } as any);

    vi.mocked(creativePatternsRepo.listPatternsForProduct).mockResolvedValue([mockPattern] as any);
    vi.mocked(trendSnapshotsRepo.listSnapshotsForProduct).mockResolvedValue([mockTrend] as any);
    vi.mocked(scriptwriterChain).mockResolvedValue(structuredScript);

    vi.mocked(scriptsRepo.createScript).mockResolvedValue({
      script_id: "script-123",
      product_id: baseInput.productId,
      script_text: expectedScriptText,
      hook: structuredScript.hook,
      creative_variables: expectedCreativeVariables,
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
    expect(creativePatternsRepo.listPatternsForProduct).toHaveBeenCalledWith(baseInput.productId);
    expect(trendSnapshotsRepo.listSnapshotsForProduct).toHaveBeenCalledWith(baseInput.productId);

    expect(scriptwriterChain).toHaveBeenCalledWith({
      productId: baseInput.productId,
      productSummary: baseInput.productSummary,
      patternSummaries: [
        `Pattern ${mockPattern.pattern_id}: structure=${mockPattern.structure}; style=${mockPattern.style_tags?.join(", ")}; emotion=${mockPattern.emotion_tags?.join(", ")}; hook="${mockPattern.hook_text}"`,
      ],
      trendSummaries: [
        `Trend ${mockTrend.snapshot_id}: tags=${mockTrend.tiktok_trend_tags?.join(", ")}; velocity=${mockTrend.velocity_score}; popularity=${mockTrend.popularity_score}`,
      ],
      creativeVariables: baseInput.creativeVariables,
    });

    expect(scriptsRepo.createScript).toHaveBeenCalledWith({
      productId: baseInput.productId,
      scriptText: expectedScriptText,
      hook: structuredScript.hook,
      creativeVariables: expectedCreativeVariables,
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
    const invalidInput = { productId: "", productSummary: "" };

    await expect(agent.run(invalidInput)).rejects.toThrow();

    expect(productsRepo.getProductById).not.toHaveBeenCalled();
    expect(creativePatternsRepo.listPatternsForProduct).not.toHaveBeenCalled();
    expect(trendSnapshotsRepo.listSnapshotsForProduct).not.toHaveBeenCalled();
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
