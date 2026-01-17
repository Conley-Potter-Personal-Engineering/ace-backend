import { describe, expect, it, vi } from "vitest";
import { listSystemEventsApi } from "@/api/handlers/systemEventsHandler";

vi.mock("@/lib/api/repositories/systemEventsRepository", () => ({
  getSystemEvents: vi.fn(),
  createSystemEvent: vi.fn(),
}));

vi.mock("@/db/supabase", () => ({
  getSupabase: vi.fn(() => ({ name: "supabase" })),
}));

const repo = await import("@/lib/api/repositories/systemEventsRepository");
const supabase = await import("@/db/supabase");

describe("listSystemEventsApi", () => {
  it("returns events with default pagination", async () => {
    vi.mocked(repo.getSystemEvents).mockResolvedValue({
      events: [
        {
          event_id: "event-1",
          created_at: "2024-01-01T00:00:00.000Z",
          severity: "info",
          event_type: "workflow.stage.start",
          event_category: "workflow",
          message: "Stage started",
          workflow_id: "wf-1",
          correlation_id: "corr-1",
          agent_name: "ScriptwriterAgent",
          metadata: { detail: "alpha" },
        },
      ],
      total: 1,
    } as any);

    const result = await listSystemEventsApi({});

    expect(supabase.getSupabase).toHaveBeenCalled();
    expect(repo.getSystemEvents).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ limit: 100, offset: 0 }),
    );
    expect(result.data).toEqual([
      {
        id: "event-1",
        timestamp: "2024-01-01T00:00:00.000Z",
        severity: "info",
        event_type: "workflow.stage.start",
        event_category: "workflow",
        message: "Stage started",
        workflow_id: "wf-1",
        correlation_id: "corr-1",
        agent_name: "ScriptwriterAgent",
        metadata: { detail: "alpha" },
      },
    ]);
    expect(result.pagination).toEqual({
      total: 1,
      limit: 100,
      offset: 0,
      has_more: false,
    });
  });

  it.each([
    [
      "severity",
      { severity: "error" },
      { severity: "error" },
    ],
    [
      "agent_name",
      { agent_name: "EditorAgent" },
      { agent_name: "EditorAgent" },
    ],
    [
      "event_type",
      { event_type: "workflow.stage.start" },
      { event_type: "workflow.stage.start" },
    ],
    [
      "event_category",
      { event_category: "workflow" },
      { event_category: "workflow" },
    ],
    [
      "workflow_id",
      { workflow_id: "workflow-1" },
      { workflow_id: "workflow-1" },
    ],
    [
      "correlation_id",
      { correlation_id: "corr-1" },
      { correlation_id: "corr-1" },
    ],
    [
      "start_date",
      { start_date: "2024-01-01T00:00:00.000Z" },
      { start_date: "2024-01-01T00:00:00.000Z" },
    ],
    [
      "end_date",
      { end_date: "2024-01-31T23:59:59.000Z" },
      { end_date: "2024-01-31T23:59:59.000Z" },
    ],
    [
      "search",
      { search: "alpha" },
      { search: "alpha" },
    ],
  ])("passes %s filter", async (_label, query, expected) => {
    vi.mocked(repo.getSystemEvents).mockResolvedValue({
      events: [],
      total: 0,
    } as any);

    await listSystemEventsApi(query as Record<string, string>);

    expect(repo.getSystemEvents).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining(expected),
    );
  });

  it("passes combined filters and pagination", async () => {
    vi.mocked(repo.getSystemEvents).mockResolvedValue({
      events: [],
      total: 10,
    } as any);

    const result = await listSystemEventsApi({
      severity: "warning",
      event_category: "agent",
      workflow_id: "workflow-1",
      limit: "2",
      offset: "2",
    });

    expect(repo.getSystemEvents).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        severity: "warning",
        event_category: "agent",
        workflow_id: "workflow-1",
        limit: 2,
        offset: 2,
      }),
    );
    expect(result.pagination).toEqual({
      total: 10,
      limit: 2,
      offset: 2,
      has_more: true,
    });
  });

  it("rejects limit above max", async () => {
    await expect(listSystemEventsApi({ limit: "501" })).rejects.toThrow();
  });

  it("returns empty result set when no events found", async () => {
    vi.mocked(repo.getSystemEvents).mockResolvedValue({
      events: [],
      total: 0,
    } as any);

    const result = await listSystemEventsApi({ limit: "100", offset: "0" });

    expect(result.data).toEqual([]);
    expect(result.pagination).toEqual({
      total: 0,
      limit: 100,
      offset: 0,
      has_more: false,
    });
  });
});
