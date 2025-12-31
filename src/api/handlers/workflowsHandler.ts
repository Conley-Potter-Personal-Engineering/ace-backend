import { fetchRecentSystemEvents, logSystemEvent } from "../../repos/systemEvents";
import type { Json } from "../../db/types";
import {
  WorkflowIdSchema,
  WorkflowStartRequestSchema,
  type WorkflowId,
} from "../../schemas/apiSchemas";

type WorkflowStatus = "idle" | "running" | "error";

export interface WorkflowStatusRow {
  id: WorkflowId;
  status: WorkflowStatus;
  lastRun: string | null;
  lastEvent: string | null;
}

const workflowCatalog: WorkflowId[] = [
  "content-cycle",
  "trend-refresh",
  "publish-only",
  "optimization-cycle",
  "analytics-ingestion",
];

const deriveStatus = (eventType?: string | null): WorkflowStatus => {
  if (!eventType) {
    return "idle";
  }

  if (eventType.includes("error")) {
    return "error";
  }

  if (eventType.endsWith(".start") || eventType === "workflow.start") {
    return "running";
  }

  return "idle";
};

const isWorkflowEvent = (eventType?: string | null) =>
  Boolean(eventType && eventType.startsWith("workflow."));

const isNewer = (candidate?: string | null, current?: string | null) => {
  if (!candidate) {
    return false;
  }
  if (!current) {
    return true;
  }
  return new Date(candidate).getTime() > new Date(current).getTime();
};

const knownWorkflowIds = new Set<WorkflowId>(workflowCatalog);

type SystemEventRow = {
  payload?: unknown | null;
  event_type?: string | null;
  created_at?: string | null;
  agent_name?: string | null;
};

const resolveWorkflowId = (
  event: SystemEventRow,
): WorkflowId | null => {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const payloadCandidates = [
    payload.workflowId,
    payload.workflow_id,
    payload.workflow,
    payload.id,
  ];

  const fromPayload = payloadCandidates.find(
    (candidate): candidate is string => typeof candidate === "string",
  );
  if (fromPayload && knownWorkflowIds.has(fromPayload as WorkflowId)) {
    return fromPayload as WorkflowId;
  }

  const fromEventType = workflowCatalog.find((id) =>
    (event.event_type ?? "").includes(id),
  );
  if (fromEventType) {
    return fromEventType;
  }

  const agentNameCandidate =
    typeof event.agent_name === "string" &&
    knownWorkflowIds.has(event.agent_name as WorkflowId)
      ? (event.agent_name as WorkflowId)
      : null;

  return agentNameCandidate ?? null;
};

export const listWorkflowStatuses = async (): Promise<WorkflowStatusRow[]> => {
  const events = await fetchRecentSystemEvents(200);
  const statuses = new Map<WorkflowId, WorkflowStatusRow>();

  workflowCatalog.forEach((id) => {
    statuses.set(id, {
      id,
      status: "idle",
      lastRun: null,
      lastEvent: null,
    });
  });

  events
    .filter((event) => isWorkflowEvent(event.event_type))
    .forEach((event) => {
      const workflowId = resolveWorkflowId(event);
      if (!workflowId) {
        return;
      }

      const current = statuses.get(workflowId) ?? {
        id: workflowId,
        status: "idle" as WorkflowStatus,
        lastRun: null,
        lastEvent: null,
      };

      if (isNewer(event.created_at, current.lastRun)) {
        statuses.set(workflowId, {
          id: workflowId,
          status: deriveStatus(event.event_type),
          lastRun: event.created_at ?? current.lastRun,
          lastEvent: event.event_type ?? current.lastEvent,
        });
      }
    });

  return Array.from(statuses.values()).sort((a, b) => a.id.localeCompare(b.id));
};
export const startWorkflow = async (workflowId: string, rawBody: unknown): Promise<{ workflow: WorkflowId; status: "started" }> => {
  const validatedId = WorkflowIdSchema.parse(workflowId);
  const parsedBody = WorkflowStartRequestSchema.parse(rawBody ?? {});

  await logSystemEvent({
    agent_name: validatedId,
    event_type: "workflow.start",
    payload: ({ workflowId: validatedId, input: (parsedBody.input ?? null) as Record<string, Json> | null } as unknown) as Json,
    created_at: new Date().toISOString(),
  });

  return {
    workflow: validatedId,
    status: "started",
  };
};
