import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSystemEventApi } from "@/api/handlers/systemEventsHandler";
import { withApiKeyAuth } from "@/lib/api/middleware/apiKeyAuth";

vi.mock("@/repos/systemEvents", () => ({
  createSystemEvent: vi.fn(),
}));

const repo = await import("@/repos/systemEvents");

const buildRes = () => {
  let statusCode = 200;
  let body: any;
  return {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: any) {
      body = payload;
      return this;
    },
    getStatus: () => statusCode,
    getBody: () => body,
  };
};

describe("createSystemEventApi", () => {
  beforeEach(() => {
    vi.mocked(repo.createSystemEvent).mockReset();
  });

  it("creates an event with required fields", async () => {
    vi.mocked(repo.createSystemEvent).mockResolvedValue({
      event_id: "event-1",
      created_at: "2024-01-01T00:00:00.000Z",
      event_type: "workflow.stage.start",
      severity: "info",
    } as any);

    const input = {
      event_type: "workflow.stage.start",
      event_category: "workflow",
      severity: "info",
      message: "Stage started",
    };

    const result = await createSystemEventApi(input);

    expect(result).toEqual({
      id: "event-1",
      timestamp: "2024-01-01T00:00:00.000Z",
      event_type: "workflow.stage.start",
      severity: "info",
    });
    expect(repo.createSystemEvent).toHaveBeenCalledWith(
      expect.objectContaining(input),
    );
  });

  it("creates an event with optional fields", async () => {
    vi.mocked(repo.createSystemEvent).mockResolvedValue({
      event_id: "event-2",
      created_at: "2024-01-02T00:00:00.000Z",
      event_type: "agent.run.success",
      severity: "debug",
    } as any);

    const input = {
      event_type: "agent.run.success",
      event_category: "agent",
      severity: "debug",
      message: "Agent completed",
      workflow_id: "wf-1",
      correlation_id: "corr-1",
      agent_name: "ScriptwriterAgent",
      metadata: {
        stage: "generate",
        extra: { attempt: 2 },
      },
    };

    await createSystemEventApi(input);

    expect(repo.createSystemEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        workflow_id: "wf-1",
        correlation_id: "corr-1",
        agent_name: "ScriptwriterAgent",
        metadata: {
          stage: "generate",
          extra: { attempt: 2 },
        },
      }),
    );
  });

  it("rejects missing required fields", async () => {
    await expect(createSystemEventApi({})).rejects.toThrow();
    expect(repo.createSystemEvent).not.toHaveBeenCalled();
  });

  it("rejects invalid severity values", async () => {
    await expect(
      createSystemEventApi({
        event_type: "workflow.stage.start",
        event_category: "workflow",
        severity: "nope",
        message: "Bad severity",
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid event_category values", async () => {
    await expect(
      createSystemEventApi({
        event_type: "workflow.stage.start",
        event_category: "invalid",
        severity: "info",
        message: "Bad category",
      }),
    ).rejects.toThrow();
  });

  it("rejects metadata larger than 10KB", async () => {
    const metadata = {
      data: "a".repeat(10 * 1024 + 1),
    };

    await expect(
      createSystemEventApi({
        event_type: "workflow.stage.start",
        event_category: "workflow",
        severity: "info",
        message: "Oversized metadata",
        metadata,
      }),
    ).rejects.toThrow();
  });
});

describe("withApiKeyAuth", () => {
  it("returns UNAUTHORIZED when missing x-api-key", async () => {
    const handler = vi.fn();
    const wrapped = withApiKeyAuth(handler);

    const res = buildRes();
    await wrapped({ headers: {} }, res as any);

    expect(res.getStatus()).toBe(401);
    expect(res.getBody()).toEqual({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "API key required",
      },
    });
    expect(handler).not.toHaveBeenCalled();
  });
});
