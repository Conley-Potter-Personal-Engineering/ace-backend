import { randomUUID } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScriptwriterAgent } from "@/agents/ScriptwriterAgent";
import * as agentNotesRepo from "@/repos/agentNotes";
import * as productsRepo from "@/repos/products";
import * as scriptsRepo from "@/repos/scripts";
import { ScriptOutput, ScriptWriterInput } from "@/schemas/scriptwriterSchemas";
import { ScriptInsertSchema } from "@/schemas/scriptsSchema";
import * as scriptwriterChainModule from "@/llm/chains/scriptwriterChain";

type TableName =
  | "products"
  | "scripts"
  | "system_events"
  | "agent_notes"
  | "creative_patterns"
  | "trend_snapshots";

type Row = Record<string, any>;

function createInMemorySupabase() {
  const db: Record<TableName, Row[]> = {
    products: [],
    scripts: [],
    system_events: [],
    agent_notes: [],
    creative_patterns: [],
    trend_snapshots: [],
  };

  const buildQuery = (table: TableName) => {
    const filters: Array<(row: Row) => boolean> = [];
    let orderSpec: { column: string; ascending: boolean } | null = null;
    let responseData: Row[] = [];
    let hasExplicitResponse = false;

    const applyFilters = () => {
      const base = db[table];
      const filtered = filters.length
        ? base.filter((row) => filters.every((fn) => fn(row)))
        : [...base];

      if (orderSpec) {
        filtered.sort((a, b) => {
          const aVal = a[orderSpec.column];
          const bVal = b[orderSpec.column];
          if (aVal === bVal) return 0;
          return orderSpec.ascending
            ? aVal > bVal
              ? 1
              : -1
            : aVal < bVal
            ? 1
            : -1;
        });
      }

      return filtered;
    };

    const response = {
      insert: (payload: Row | Row[]) => {
        const rows = Array.isArray(payload) ? payload : [payload];
        const now = new Date().toISOString();
        const inserted = rows.map((row) => {
          const record = { ...row };
          if (table === "scripts" && !record.script_id) {
            record.script_id = randomUUID();
          }
          if (table === "products" && !record.product_id) {
            record.product_id = randomUUID();
          }
          if ("created_at" in record && !record.created_at) {
            record.created_at = now;
          }
          db[table].push(record);
          return record;
        });
        responseData = inserted;
        hasExplicitResponse = true;
        return response;
      },
      select: () => {
        hasExplicitResponse = false;
        return response;
      },
      update: (changes: Row) => {
        const updated: Row[] = [];
        db[table] = db[table].map((row) => {
          if (!filters.length || filters.every((fn) => fn(row))) {
            const newRow = { ...row, ...changes };
            updated.push(newRow);
            return newRow;
          }
          return row;
        });
        responseData = updated;
        hasExplicitResponse = true;
        return response;
      },
      delete: () => {
        const removed = db[table].filter(
          (row) => filters.length && filters.every((fn) => fn(row)),
        );
        db[table] = db[table].filter(
          (row) => !(filters.length && filters.every((fn) => fn(row))),
        );
        responseData = removed;
        hasExplicitResponse = true;
        return response;
      },
      eq: (column: string, value: unknown) => {
        filters.push((row) => row[column] === value);
        return response;
      },
      order: (column: string, options?: { ascending?: boolean }) => {
        orderSpec = { column, ascending: options?.ascending ?? true };
        return response;
      },
      limit: (limit: number) => {
        responseData = responseData.slice(0, limit);
        hasExplicitResponse = true;
        return response;
      },
      ilike: () => response,
      returns: () => response,
      single: async () => ({
        data: (hasExplicitResponse ? responseData : applyFilters())[0] ?? null,
        error: null,
      }),
      maybeSingle: async () => ({
        data: (hasExplicitResponse ? responseData : applyFilters())[0] ?? null,
        error: null,
      }),
      then: (onFulfilled: (value: { data: Row[]; error: null }) => unknown) =>
        Promise.resolve({
          data: hasExplicitResponse ? responseData : applyFilters(),
          error: null,
        }).then(onFulfilled),
      catch: (
        onRejected: (reason?: unknown) => unknown,
      ): Promise<unknown> => Promise.resolve({ data: null, error: null }).catch(onRejected),
      finally: (onFinally?: (() => void) | null | undefined) =>
        Promise.resolve().finally(onFinally),
    };

    return response;
  };

  const getSupabase = () => ({
    from: (table: TableName) => buildQuery(table),
  });

  const reset = () => {
    (Object.keys(db) as TableName[]).forEach((key) => {
      db[key] = [];
    });
  };

  return { getSupabase, db, reset };
}

const mockDb = vi.hoisted(() => createInMemorySupabase());

vi.mock("@/db/db", () => ({
  getSupabase: mockDb.getSupabase,
}));

const describeIf = describe;

const clearTablesForAgent = (agentName: string, productId?: string) => {
  mockDb.db.system_events = mockDb.db.system_events.filter(
    (event) => event.agent_name !== agentName,
  );
  mockDb.db.agent_notes = mockDb.db.agent_notes.filter(
    (note) => note.agent_name !== agentName,
  );

  if (productId) {
    mockDb.db.scripts = mockDb.db.scripts.filter(
      (script) => script.product_id !== productId,
    );
    mockDb.db.products = mockDb.db.products.filter(
      (product) => product.product_id !== productId,
    );
  }
};

describeIf("ScriptwriterAgent integration", () => {
  const baseAgentName = "ScriptwriterAgentIntegration";
  let agentName: string;
  let productId: string;

  beforeEach(async () => {
    agentName = `${baseAgentName}-${randomUUID()}`;
    productId = randomUUID();
    mockDb.reset();
    clearTablesForAgent(agentName, productId);
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    clearTablesForAgent(agentName, productId);
    vi.restoreAllMocks();
  });

  it("persists script, note, and ordered events on success", async () => {
    const structuredScript = ScriptOutput.parse({
      title: "Integration Title",
      hook: "Integration Hook",
      cta: "Integration CTA",
      outline: ["Beat one", "Beat two"],
      body: "Full integration body.",
    });

    const chainSpy = vi
      .spyOn(scriptwriterChainModule, "scriptwriterChain")
      .mockResolvedValue(structuredScript);

    await productsRepo.createProduct({
      product_id: productId,
      name: "Integration Product",
      description: "Integration product description",
      source_platform: "integration",
      category: "testing",
      brand: "IntegrationBrand",
      price_usd: 49.99,
      currency: "USD",
      target_audience: "Busy professionals",
      primary_benefit: "Saves time",
      content_brief: "Highlight convenience and speed",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      affiliate_link: null,
      image_url: null,
      key_features: ["feature1", "feature2"],
      objections: ["objection1"],
      demo_ideas: ["demo1"],
      meta: { compliance: ["No medical claims"] },
    });

    const creativePatternId = "8c76f6dd-44c3-4d4c-9c28-0d2b6c4c1e62";
    const trendSnapshotId = "2b6f0c45-cf59-4f43-b88b-8b7e0c8f44ef";

    mockDb.db.creative_patterns.push({
      pattern_id: creativePatternId,
      product_id: productId,
      structure: "Story arc",
      style_tags: ["casual"],
      emotion_tags: ["bold"],
      hook_text: "Lead with surprise",
      created_at: new Date().toISOString(),
      updated_at: null,
      description: "A reusable pattern",
      name: "Pattern One",
      meta: null,
      source_platform: "integration",
    });

    mockDb.db.trend_snapshots.push({
      snapshot_id: trendSnapshotId,
      product_id: productId,
      tiktok_trend_tags: ["tag-a", "tag-b"],
      velocity_score: 0.9,
      popularity_score: 0.8,
      created_at: new Date().toISOString(),
      captured_at: new Date().toISOString(),
      meta: null,
    });

    const input = ScriptWriterInput.parse({
      productId,
      creativePatternId,
      trendSnapshotId,
    });

    const agent = new ScriptwriterAgent({ agentName });
    const result = await agent.run(input);

    expect(chainSpy).toHaveBeenCalledWith({
      product: expect.objectContaining({
        product_id: productId,
      }),
      pattern: expect.objectContaining({
        pattern_id: creativePatternId,
      }),
      trend: expect.objectContaining({
        snapshot_id: trendSnapshotId,
      }),
    });

    const storedScript = (await scriptsRepo.getScriptById(
      result.scriptId,
    )) as any;
    expect(storedScript).toBeTruthy();
    expect(storedScript?.product_id).toBe(productId);
    expect(storedScript?.hook).toBe(structuredScript.hook);
    expect(storedScript?.script_text).toContain(structuredScript.body);
    ScriptInsertSchema.parse({
      scriptId: storedScript?.script_id,
      productId: storedScript?.product_id,
      scriptText: storedScript?.script_text,
      hook: storedScript?.hook,
      creativeVariables: storedScript?.creative_variables,
      creativePatternId: storedScript?.creative_pattern_id,
      trendReference: storedScript?.trend_reference,
      createdAt: storedScript?.created_at,
    });

    const notes = await agentNotesRepo.listNotesForAgent(agentName);
    expect(notes.some((note) => note.topic === "script_generation")).toBe(true);

    const eventTypes = mockDb.db.system_events
      .filter((event) => event.agent_name === agentName)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      .map((event) => event.event_type);
    expect(eventTypes).toEqual([
      "script.generate.start",
      "script.generate.success",
    ]);

    expect(result.script.product_id).toBe(productId);
    expect(result.scriptId).toBeDefined();
  });

  it("logs error events when the chain fails", async () => {
    vi.spyOn(scriptwriterChainModule, "scriptwriterChain").mockRejectedValueOnce(
      new Error("Chain failure"),
    );

    await productsRepo.createProduct({
      product_id: productId,
      name: "Integration Product",
      description: "Integration product description",
      source_platform: "integration",
      category: "testing",
      brand: "IntegrationBrand",
      price_usd: 49.99,
      currency: "USD",
      target_audience: "Busy professionals",
      primary_benefit: "Saves time",
      content_brief: "Highlight convenience and speed",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      affiliate_link: null,
      image_url: null,
      key_features: ["feature1", "feature2"],
      objections: ["objection1"],
      demo_ideas: ["demo1"],
      meta: { compliance: ["No medical claims"] },
    });

    mockDb.db.creative_patterns.push({
      pattern_id: "8c76f6dd-44c3-4d4c-9c28-0d2b6c4c1e62",
      product_id: productId,
      structure: "Story arc",
      style_tags: ["casual"],
      emotion_tags: ["bold"],
      hook_text: "Lead with surprise",
      created_at: new Date().toISOString(),
      updated_at: null,
      description: "A reusable pattern",
      name: "Pattern One",
      meta: null,
      source_platform: "integration",
    });

    mockDb.db.trend_snapshots.push({
      snapshot_id: "2b6f0c45-cf59-4f43-b88b-8b7e0c8f44ef",
      product_id: productId,
      tiktok_trend_tags: ["tag-a", "tag-b"],
      velocity_score: 0.9,
      popularity_score: 0.8,
      created_at: new Date().toISOString(),
      captured_at: new Date().toISOString(),
      meta: null,
    });

    const input = ScriptWriterInput.parse({
      productId,
      creativePatternId: "8c76f6dd-44c3-4d4c-9c28-0d2b6c4c1e62",
      trendSnapshotId: "2b6f0c45-cf59-4f43-b88b-8b7e0c8f44ef",
    });

    const agent = new ScriptwriterAgent({ agentName });

    await expect(agent.run(input)).rejects.toThrow("Chain failure");

    const scripts = await scriptsRepo.listScriptsForProduct(productId);
    expect(scripts).toHaveLength(0);

    const eventTypes = mockDb.db.system_events
      .filter((event) => event.agent_name === agentName)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      .map((event) => event.event_type);
    expect(eventTypes).toEqual([
      "script.generate.start",
      "script.generate.error",
    ]);
  });
});
