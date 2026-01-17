import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { integrationEnv } from "../setup";
import { getSystemEventDetailApi } from "@/api/handlers/systemEventsHandler";
import { deleteSystemEvent, logSystemEvent } from "@/repos/systemEvents";

const describeIf = integrationEnv.hasSupabaseCredentials ? describe : describe.skip;

describeIf("GET /api/system-events/[id] (integration)", () => {
  const ids = {
    eventA: randomUUID(),
    eventB: randomUUID(),
    eventC: randomUUID(),
    eventD: randomUUID(),
    eventE: randomUUID(),
    eventF: randomUUID(),
    corr1: randomUUID(),
    wf1: randomUUID(),
    wf2: randomUUID(),
  };

  beforeAll(async () => {
    await logSystemEvent({
      event_id: ids.eventA,
      event_type: "workflow.stage.start",
      event_category: "workflow",
      severity: "info",
      message: "A",
      workflow_id: ids.wf1,
      correlation_id: ids.corr1,
      created_at: "2024-01-01T00:00:00.000Z",
    });

    await logSystemEvent({
      event_id: ids.eventB,
      event_type: "workflow.stage.success",
      event_category: "workflow",
      severity: "info",
      message: "B",
      workflow_id: ids.wf1,
      correlation_id: ids.corr1,
      created_at: "2024-01-01T00:01:00.000Z",
    });

    await logSystemEvent({
      event_id: ids.eventC,
      event_type: "workflow.stage.end",
      event_category: "workflow",
      severity: "info",
      message: "C",
      workflow_id: ids.wf1,
      correlation_id: ids.corr1,
      created_at: "2024-01-01T00:02:00.000Z",
    });

    await logSystemEvent({
      event_id: ids.eventD,
      event_type: "workflow.stage.log",
      event_category: "workflow",
      severity: "debug",
      message: "D",
      workflow_id: ids.wf1,
      correlation_id: null,
      created_at: "2024-01-01T00:03:00.000Z",
    });

    await logSystemEvent({
      event_id: ids.eventE,
      event_type: "workflow.stage.start",
      event_category: "workflow",
      severity: "info",
      message: "E",
      workflow_id: ids.wf2,
      correlation_id: null,
      created_at: "2024-02-01T00:00:00.000Z",
    });

    await logSystemEvent({
      event_id: ids.eventF,
      event_type: "workflow.stage.success",
      event_category: "workflow",
      severity: "info",
      message: "F",
      workflow_id: ids.wf2,
      correlation_id: null,
      created_at: "2024-02-01T00:01:00.000Z",
    });
  });

  afterAll(async () => {
    await deleteSystemEvent(ids.eventA);
    await deleteSystemEvent(ids.eventB);
    await deleteSystemEvent(ids.eventC);
    await deleteSystemEvent(ids.eventD);
    await deleteSystemEvent(ids.eventE);
    await deleteSystemEvent(ids.eventF);
  });

  it("returns related events by correlation_id in chronological order", async () => {
    const result = await getSystemEventDetailApi(ids.eventA);

    expect(result?.id).toBe(ids.eventA);
    expect(result?.related_events.map((event) => event.id)).toEqual([
      ids.eventB,
      ids.eventC,
    ]);
  });

  it("falls back to workflow_id when correlation_id is missing", async () => {
    const result = await getSystemEventDetailApi(ids.eventE);

    expect(result?.id).toBe(ids.eventE);
    expect(result?.related_events.map((event) => event.id)).toEqual([
      ids.eventF,
    ]);
  });

  it("returns null for missing events", async () => {
    const result = await getSystemEventDetailApi(randomUUID());
    expect(result).toBeNull();
  });
});
