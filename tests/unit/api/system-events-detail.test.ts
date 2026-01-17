import { describe, expect, it, vi } from "vitest";
import { getSystemEventDetailApi } from "@/api/handlers/systemEventsHandler";

vi.mock("@/lib/api/repositories/systemEventsRepository", () => ({
  getSystemEvents: vi.fn(),
  createSystemEvent: vi.fn(),
  getSystemEventById: vi.fn(),
  getSystemEventsByCorrelationId: vi.fn(),
  getSystemEventsByWorkflowId: vi.fn(),
}));

vi.mock("@/db/supabase", () => ({
  getSupabase: vi.fn(() => ({ name: "supabase" })),
}));

const repo = await import("@/lib/api/repositories/systemEventsRepository");

describe("getSystemEventDetailApi", () => {
  it("returns null when event is not found", async () => {
    vi.mocked(repo.getSystemEventById).mockResolvedValue(null);

    const result = await getSystemEventDetailApi(
      "d290f1ee-6c54-4b01-90e6-d701748f0851",
    );

    expect(result).toBeNull();
  });

  it("prefers correlation_id for related events", async () => {
    vi.mocked(repo.getSystemEventById).mockResolvedValue({
      event_id: "event-1",
      created_at: "2024-01-01T00:00:00.000Z",
      event_type: "workflow.stage.start",
      event_category: "workflow",
      severity: "info",
      message: "Stage started",
      workflow_id: "wf-1",
      correlation_id: "corr-1",
      agent_name: "ScriptwriterAgent",
      metadata: { detail: "alpha" },
    } as any);

    vi.mocked(repo.getSystemEventsByCorrelationId).mockResolvedValue([
      {
        event_id: "event-2",
        created_at: "2024-01-01T00:01:00.000Z",
        event_type: "workflow.stage.success",
        severity: "info",
        message: "Stage complete",
      },
    ] as any);

    const result = await getSystemEventDetailApi(
      "d290f1ee-6c54-4b01-90e6-d701748f0851",
    );

    expect(repo.getSystemEventsByCorrelationId).toHaveBeenCalled();
    expect(repo.getSystemEventsByWorkflowId).not.toHaveBeenCalled();
    expect(result?.related_events).toEqual([
      {
        id: "event-2",
        timestamp: "2024-01-01T00:01:00.000Z",
        event_type: "workflow.stage.success",
        severity: "info",
        message: "Stage complete",
      },
    ]);
  });

  it("falls back to workflow_id when correlation_id is missing", async () => {
    vi.mocked(repo.getSystemEventById).mockResolvedValue({
      event_id: "event-3",
      created_at: "2024-01-02T00:00:00.000Z",
      event_type: "workflow.stage.start",
      event_category: "workflow",
      severity: "info",
      message: "Stage started",
      workflow_id: "wf-2",
      correlation_id: null,
      agent_name: "EditorAgent",
      metadata: null,
    } as any);

    vi.mocked(repo.getSystemEventsByWorkflowId).mockResolvedValue([
      {
        event_id: "event-4",
        created_at: "2024-01-02T00:02:00.000Z",
        event_type: "workflow.stage.error",
        severity: "error",
        message: "Stage failed",
      },
    ] as any);

    const result = await getSystemEventDetailApi(
      "f290f1ee-6c54-4b01-90e6-d701748f0851",
    );

    expect(repo.getSystemEventsByWorkflowId).toHaveBeenCalled();
    expect(result?.related_events).toHaveLength(1);
    expect(result?.related_events[0].id).toBe("event-4");
  });

  it("returns empty related_events when no correlation_id or workflow_id", async () => {
    vi.mocked(repo.getSystemEventById).mockResolvedValue({
      event_id: "event-5",
      created_at: "2024-01-03T00:00:00.000Z",
      event_type: "system.alert",
      event_category: "system",
      severity: "warning",
      message: "Alert",
      workflow_id: null,
      correlation_id: null,
      agent_name: null,
      metadata: null,
    } as any);

    const result = await getSystemEventDetailApi(
      "a290f1ee-6c54-4b01-90e6-d701748f0851",
    );

    expect(result?.related_events).toEqual([]);
  });
});
