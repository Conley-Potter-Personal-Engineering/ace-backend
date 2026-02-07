import { randomUUID } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditorAgent } from "@/agents/EditorAgent";
import * as videoAssetsRepo from "@/repos/videoAssets";
import { storageUploader } from "@/utils/storageUploader";
import { generateVideoWithVeo } from "@/utils/veoVideoGenerator";
import editorChain from "@/llm/chains/editorChain";

type TableName = "scripts" | "video_assets" | "system_events";
type Row = Record<string, any>;

function createInMemorySupabase() {
  const db: Record<TableName, Row[]> = {
    scripts: [],
    video_assets: [],
    system_events: [],
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
          if (table === "video_assets" && !record.asset_id) {
            record.asset_id = randomUUID();
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

const editorChainMock = vi.hoisted(() => vi.fn());
const generateVideoWithVeoMock = vi.hoisted(() => vi.fn());
const storageUploaderMock = vi.hoisted(() => vi.fn());
const mockDb = vi.hoisted(() => createInMemorySupabase());

vi.mock("@/llm/chains/editorChain", () => ({
  default: editorChainMock,
}));

vi.mock("@/utils/veoVideoGenerator", () => ({
  generateVideoWithVeo: generateVideoWithVeoMock,
  default: generateVideoWithVeoMock,
}));

vi.mock("@/utils/storageUploader", () => ({
  storageUploader: storageUploaderMock,
}));

vi.mock("@/db/db", () => ({
  getSupabase: mockDb.getSupabase,
}));

const assertEventOrder = (events: string[], expected: string[]) => {
  let index = 0;
  for (const event of events) {
    if (event === expected[index]) {
      index += 1;
    }
    if (index >= expected.length) {
      break;
    }
  }
  expect(index).toBe(expected.length);
};

const getEventTypesForAgent = (agentName: string) =>
  mockDb.db.system_events
    .filter((event) => event.agent_name === agentName)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    .map((event) => event.event_type);

describe("EditorAgent VEO integration", () => {
  let agentName: string;

  beforeEach(() => {
    agentName = `EditorAgentIntegration-${randomUUID()}`;
    mockDb.reset();
    mockDb.db.video_assets = [];
    mockDb.db.system_events = [];
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates, uploads, and persists a video asset on success", async () => {
    const scriptId = randomUUID();
    mockDb.db.scripts.push({
      script_id: scriptId,
      product_id: randomUUID(),
      script_text: "Sample script text",
      hook: "Sample hook",
      creative_variables: { emotion: "joy", structure: "arc", style: "punchy" },
      created_at: new Date().toISOString(),
    });

    editorChainMock.mockResolvedValue({
      storagePath: "videos/rendered/mock.mp4",
      thumbnailPath: "videos/rendered/mock.jpg",
      durationSeconds: 12,
      metadata: {
        title: "Demo Video",
        summary: "Demo summary",
        beats: [
          {
            timestamp: "0:00",
            visual: "Opening shot",
            narration: "Intro narration",
          },
        ],
      },
      styleTags: ["retro"],
      mockVideo: "mockVideo",
    });

    generateVideoWithVeoMock.mockResolvedValue({
      buffer: Buffer.from("fakeVideo"),
      metadata: { duration: 12, format: "mp4" },
    });

    storageUploaderMock.mockResolvedValue("https://mock.storage/video.mp4");

    const agent = new EditorAgent({ agentName });
    const input = {
      scriptId,
      composition: {
        duration: 12,
        tone: "uplifting",
        layout: "montage",
      },
      renderBackend: "supabase",
    };

    const result = await agent.run(input);

    const expectedPrompt =
      "Generate a 12-second uplifting video in montage layout about: Demo summary.";

    expect(generateVideoWithVeo).toHaveBeenCalledTimes(1);
    expect(generateVideoWithVeo).toHaveBeenCalledWith(expectedPrompt, {
      duration: 12,
    });
    expect(storageUploader).toHaveBeenCalledTimes(1);
    expect(storageUploader).toHaveBeenCalledWith(
      expect.any(Buffer),
      "supabase",
      "videos/rendered/mock.mp4",
      "video/mp4",
    );

    const persistedAssets = await videoAssetsRepo.listAssetsForScript(scriptId);
    expect(persistedAssets).toHaveLength(1);
    expect(persistedAssets[0]?.storage_path).toBe(
      "https://mock.storage/video.mp4",
    );
    expect(persistedAssets[0]?.duration_seconds).toBe(12);
    expect(result.asset.tone).toBe("uplifting");
    expect(result.asset.layout).toBe("montage");
    expect(result.asset.styleTags).toEqual(["retro"]);
    expect(result.storageUrl).toBe("https://mock.storage/video.mp4");
    expect(result.metadata.title).toBe("Demo Video");

    const eventTypes = getEventTypesForAgent(agentName);
    assertEventOrder(eventTypes, [
      "video.render.start",
      "video.render.progress",
      "video.generate.start",
      "video.generate.success",
      "video.render.progress",
      "video.assets.uploaded",
      "video.render.success",
      "video.assets.created",
    ]);
  });

  it("logs error events when Gemini generation fails", async () => {
    const scriptId = randomUUID();
    mockDb.db.scripts.push({
      script_id: scriptId,
      product_id: randomUUID(),
      script_text: "Sample script text",
      hook: "Sample hook",
      creative_variables: { emotion: "joy", structure: "arc", style: "punchy" },
      created_at: new Date().toISOString(),
    });

    editorChainMock.mockResolvedValue({
      storagePath: "videos/rendered/mock.mp4",
      thumbnailPath: "videos/rendered/mock.jpg",
      durationSeconds: 8,
      metadata: {
        title: "Failure Video",
        summary: "Failure summary",
        beats: [
          {
            timestamp: "0:00",
            visual: "Opening shot",
            narration: "Intro narration",
          },
        ],
      },
      styleTags: ["noir"],
      mockVideo: "mockVideo",
    });

    generateVideoWithVeoMock.mockRejectedValue(new Error("Gemini failed"));

    const agent = new EditorAgent({ agentName });
    const input = {
      scriptId,
      composition: {
        duration: 8,
        tone: "moody",
        layout: "split-screen",
      },
      renderBackend: "supabase",
    };

    await expect(agent.run(input)).rejects.toThrow("Gemini failed");

    const persistedAssets = await videoAssetsRepo.listAssetsForScript(scriptId);
    expect(persistedAssets).toHaveLength(0);

    const eventTypes = getEventTypesForAgent(agentName);
    expect(eventTypes).toContain("video.generate.error");
    expect(eventTypes).toContain("video.render.error");
    expect(eventTypes).not.toContain("agent.error");
    expect(eventTypes).not.toContain("video.generate.success");
    expect(eventTypes).not.toContain("agent.success");
  });

  it("fails validation before executing the chain when input is malformed", async () => {
    const agent = new EditorAgent({ agentName });
    const input = {
      composition: {
        duration: 10,
        tone: "bright",
        layout: "carousel",
      },
      renderBackend: "supabase",
    };

    await expect(agent.run(input)).rejects.toThrow();

    expect(editorChain).not.toHaveBeenCalled();

    const eventTypes = getEventTypesForAgent(agentName);
    expect(eventTypes).toContain("video.render.error");
    expect(eventTypes).not.toContain("agent.error");
    expect(eventTypes).not.toContain("video.generate.start");
    expect(eventTypes).not.toContain("video.generate.success");
    expect(eventTypes).not.toContain("agent.success");
  });
});
