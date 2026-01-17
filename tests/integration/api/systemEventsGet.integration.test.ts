import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { integrationEnv } from "../setup";
import { listSystemEventsApi } from "@/api/handlers/systemEventsHandler";
import { deleteSystemEvent, logSystemEvent } from "@/repos/systemEvents";

const describeIf = integrationEnv.hasSupabaseCredentials ? describe : describe.skip;

describeIf("GET /api/system-events (integration)", () => {
  const ids = {
    event1: randomUUID(),
    event2: randomUUID(),
    event3: randomUUID(),
    workflowA: randomUUID(),
    workflowB: randomUUID(),
    correlation1: randomUUID(),
    correlation2: randomUUID(),
  };

  beforeAll(async () => {
    await logSystemEvent({
      event_id: ids.event1,
      event_type: "workflow.stage.start",
      event_category: "workflow",
      severity: "info",
      message: "Alpha stage started",
      workflow_id: ids.workflowA,
      correlation_id: ids.correlation1,
      agent_name: "ScriptwriterAgent",
      metadata: { detail: "alpha" },
      created_at: "2024-01-01T00:00:00.000Z",
    });

    await logSystemEvent({
      event_id: ids.event2,
      event_type: "agent.error",
      event_category: "agent",
      severity: "error",
      message: "Beta failure",
      workflow_id: ids.workflowB,
      correlation_id: ids.correlation2,
      agent_name: "EditorAgent",
      metadata: { detail: "beta" },
      created_at: "2024-02-01T00:00:00.000Z",
    });

    await logSystemEvent({
      event_id: ids.event3,
      event_type: "system.alert",
      event_category: "system",
      severity: "warning",
      message: "Gamma warning",
      workflow_id: ids.workflowA,
      correlation_id: ids.correlation1,
      agent_name: "PublisherAgent",
      metadata: { detail: "gamma" },
      created_at: "2024-03-01T00:00:00.000Z",
    });
  });

  afterAll(async () => {
    await deleteSystemEvent(ids.event1);
    await deleteSystemEvent(ids.event2);
    await deleteSystemEvent(ids.event3);
  });

  it("filters by workflow_id and severity", async () => {
    const result = await listSystemEventsApi({
      workflow_id: ids.workflowA,
      severity: "info",
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(ids.event1);
    expect(result.data[0].severity).toBe("info");
  });

  it("filters by correlation_id", async () => {
    const result = await listSystemEventsApi({
      correlation_id: ids.correlation2,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(ids.event2);
    expect(result.data[0].event_type).toBe("agent.error");
  });

  it("filters by date range", async () => {
    const result = await listSystemEventsApi({
      start_date: "2024-02-01T00:00:00.000Z",
      end_date: "2024-02-28T23:59:59.000Z",
    });

    const idsInRange = result.data.map((event) => event.id);
    expect(idsInRange).toContain(ids.event2);
    expect(idsInRange).not.toContain(ids.event1);
    expect(idsInRange).not.toContain(ids.event3);
  });

  it("searches message and metadata", async () => {
    const messageResult = await listSystemEventsApi({
      search: "Alpha",
      workflow_id: ids.workflowA,
    });
    expect(messageResult.data.map((event) => event.id)).toContain(ids.event1);

    const metadataResult = await listSystemEventsApi({
      search: "beta",
      workflow_id: ids.workflowB,
    });
    expect(metadataResult.data).toHaveLength(1);
    expect(metadataResult.data[0].id).toBe(ids.event2);
  });

  it("paginates results with correct totals", async () => {
    const result = await listSystemEventsApi({
      workflow_id: ids.workflowA,
      limit: "1",
      offset: "0",
    });

    expect(result.pagination.total).toBeGreaterThanOrEqual(2);
    expect(result.pagination.limit).toBe(1);
    expect(result.pagination.offset).toBe(0);
    expect(result.pagination.has_more).toBe(true);
    expect(result.data).toHaveLength(1);
  });
});
