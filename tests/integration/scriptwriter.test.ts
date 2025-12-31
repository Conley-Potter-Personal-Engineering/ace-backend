import { randomUUID } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import runScriptwriterHandler from "@/api/agents/scriptwriter/run";
import type { ApiResponseLike } from "@/api/http";
import * as productsRepo from "@/repos/products";
import * as scriptsRepo from "@/repos/scripts";
import * as systemEventsRepo from "@/repos/systemEvents";
import { ScriptOutput } from "@/schemas/scriptwriterSchemas";
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
      ): Promise<unknown> =>
        Promise.resolve({ data: null, error: null }).catch(onRejected),
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

const createMockResponse = () => {
  let statusCode = 0;
  let body: unknown;
  const res: ApiResponseLike = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (payload: unknown) => {
      body = payload;
      return res;
    },
  };

  return {
    res,
    getStatus: () => statusCode,
    getBody: () => body,
  };
};

describe("Scriptwriter API integration", () => {
  beforeEach(() => {
    mockDb.reset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    mockDb.reset();
    vi.restoreAllMocks();
  });

  it("returns a script and emits workflow events", async () => {
    const structuredScript = ScriptOutput.parse({
      title: "Workflow Script Title",
      hook: "Workflow hook",
      cta: "Workflow CTA",
      outline: ["Beat one", "Beat two", "Beat three"],
      body: "Full script body for workflow test.",
    });

    vi.spyOn(scriptwriterChainModule, "scriptwriterChain").mockResolvedValue(
      structuredScript,
    );

    const product = await productsRepo.createProduct({
      product_id: randomUUID(),
      name: "Workflow Product",
      description: "Workflow product description",
      source_platform: "integration",
      category: "testing",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      affiliate_link: null,
      image_url: null,
      meta: null,
    });

    const pattern = {
      pattern_id: randomUUID(),
      product_id: product.product_id,
      hook_text: "Pattern hook",
      structure: "Problem-solution",
      style_tags: ["direct"],
      emotion_tags: ["inspiring"],
      observed_performance: null,
      notes: null,
      created_at: new Date().toISOString(),
    };

    const trend = {
      snapshot_id: randomUUID(),
      product_id: product.product_id,
      popularity_score: 80,
      velocity_score: 0.7,
      competition_score: null,
      tiktok_trend_tags: ["trend-a", "trend-b"],
      raw_source_data: null,
      snapshot_time: new Date().toISOString(),
    };

    const workflowId = randomUUID();
    const correlationId = randomUUID();

    const { res, getStatus, getBody } = createMockResponse();

    await runScriptwriterHandler(
      {
        method: "POST",
        body: {
          product,
          pattern,
          trend,
          workflow_id: workflowId,
          correlation_id: correlationId,
        },
      },
      res,
    );

    expect(getStatus()).toBe(200);
    const body = getBody() as { success: boolean; data?: { script: any } };
    expect(body.success).toBe(true);
    expect(body.data?.script.product_id).toBe(product.product_id);

    const scripts = await scriptsRepo.listScriptsForProduct(product.product_id);
    expect(scripts).toHaveLength(1);
    expect(scripts[0].script_text).toContain(structuredScript.body);

    const events = await systemEventsRepo.listEventsForAgent("ScriptwriterAgent");
    const startEvent = events.find(
      (event) => event.event_type === "script.generate.start",
    );
    const successEvent = events.find(
      (event) => event.event_type === "script.generate.success",
    );

    expect(startEvent?.payload).toMatchObject({
      workflow_id: workflowId,
      correlation_id: correlationId,
    });
    expect(successEvent?.payload).toMatchObject({
      workflow_id: workflowId,
      correlation_id: correlationId,
    });
  });

  it("returns 400 for invalid payloads", async () => {
    const chainSpy = vi.spyOn(scriptwriterChainModule, "scriptwriterChain");
    const { res, getStatus, getBody } = createMockResponse();

    await runScriptwriterHandler(
      {
        method: "POST",
        body: { bad: "payload" },
      },
      res,
    );

    expect(getStatus()).toBe(400);
    const body = getBody() as { success: boolean; error?: string };
    expect(body.success).toBe(false);
    expect(body.error).toBeTruthy();
    expect(chainSpy).not.toHaveBeenCalled();
  });
});
