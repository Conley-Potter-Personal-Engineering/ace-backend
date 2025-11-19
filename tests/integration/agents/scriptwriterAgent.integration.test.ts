import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ScriptwriterAgent } from "../../../src/agents/ScriptwriterAgent";
import {
  createProduct,
  deleteAgentNote,
  deleteProduct,
  deleteScript,
  getProductById,
  getScriptById,
  listEventsForAgent,
  listNotesForAgent,
} from "../../../src/repos";
import * as scriptwriterService from "../../../src/services/scriptwriterService";
import { integrationEnv } from "../setup";

const shouldRunIntegration = integrationEnv.hasSupabaseCredentials;

const describeIf = shouldRunIntegration ? describe : describe.skip;

const agentName = "ScriptwriterAgentTest";

const createTestProduct = async () => {
  const now = new Date().toISOString();

  return createProduct({
    product_id: randomUUID(),
    name: `Integration Product ${now}`,
    description: "Integration test product",
    source_platform: "integration",
    category: "testing",
    created_at: now,
    updated_at: now,
    affiliate_link: null,
    image_url: null,
    meta: null,
  });
};

describeIf("ScriptwriterAgent integration", () => {
  let productId: string;
  let scriptId: string | undefined;
  let noteId: string | undefined;

  beforeAll(() => {
    if (!shouldRunIntegration && !integrationEnv.hasSupabaseCredentials) {
      console.warn("Skipping ScriptwriterAgent integration tests due to missing Supabase credentials.");
    }
  });

  afterAll(async () => {
    if (scriptId) {
      await deleteScript(scriptId);
    }
    if (noteId) {
      await deleteAgentNote(noteId);
    }
    if (productId) {
      await deleteProduct(productId);
    }
  });

  it("creates scripts and system events end-to-end", async () => {
    const product = await createTestProduct();
    productId = product.product_id;

    vi.spyOn(scriptwriterService, "generateScript").mockResolvedValue({
      productId,
      scriptText: "Integration test script body",
      hook: "Integration hook",
      creativeVariables: {
        emotion: "focused",
        structure: "problem-solution",
        style: "direct",
      },
    });

    const agent = new ScriptwriterAgent({ agentName });
    const result = (await agent.execute({ productId })) as any;

    scriptId = result?.scriptId;
    expect(result?.script.product_id).toBe(productId);

    const storedScript = await getScriptById(result.scriptId);
    expect(storedScript?.hook).toBe("Integration hook");

    const notes = await listNotesForAgent(agentName);
    noteId = notes.find((note) => note.topic === "script_generation")?.note_id;
    expect(notes.length).toBeGreaterThan(0);

    const events = await listEventsForAgent(agentName);
    const eventTypes = events.map((event) => event.event_type);
    expect(eventTypes).toContain("script.generate.success");

    const refreshedProduct = await getProductById(productId);
    expect(refreshedProduct?.product_id).toBe(productId);
  });
});
