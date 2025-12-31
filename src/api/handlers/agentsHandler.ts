import { EditorAgent } from "../../agents/EditorAgent";
import { ScriptwriterAgent } from "../../agents/ScriptwriterAgent";
import type BaseAgent from "../../agents/BaseAgent";
import { fetchRecentSystemEvents, logSystemEvent } from "../../repos/systemEvents";
import {
  EditorAgentInputSchema,
  ScriptwriterAgentInputSchema,
} from "../../schemas/agentSchemas";
import {
  AgentNameSchema,
  AgentRunRequestSchema,
  type AgentName,
} from "../../schemas/apiSchemas";
import { z } from "zod";

type AgentStatus = "idle" | "running" | "error";

export interface AgentStatusRow {
  name: string;
  status: AgentStatus;
  lastRun: string | null;
  lastEvent: string | null;
}

interface AgentDescriptor {
  create: () => BaseAgent;
  inputSchema: z.ZodTypeAny;
}

type TriggerAgentRunSuccess = {
  message: string;
  result: unknown;
};

type TriggerAgentRunError = {
  error: string;
  details: z.ZodFormattedError<{
    agent: AgentName;
    input: Record<string, unknown>;
  }>;
};

const agentRegistry: Record<AgentName, AgentDescriptor> = {
  ScriptwriterAgent: {
    create: () => new ScriptwriterAgent(),
    inputSchema: ScriptwriterAgentInputSchema,
  },
  EditorAgent: {
    create: () => new EditorAgent(),
    inputSchema: EditorAgentInputSchema,
  },
};

const runAgentSchema = z.object({
  agent: agentNameSchema,
  input: z.record(z.any()),
});

const deriveStatus = (eventType?: string | null): AgentStatus => {
  if (!eventType) {
    return "idle";
  }

  if (eventType.includes("error")) {
    return "error";
  }

  if (eventType.endsWith(".start") || eventType === "start") {
    return "running";
  }

  return "idle";
};

const isNewer = (candidate?: string | null, current?: string | null) => {
  if (!candidate) {
    return false;
  }
  if (!current) {
    return true;
  }
  return new Date(candidate).getTime() > new Date(current).getTime();
};

export const listAgentStatuses = async (): Promise<AgentStatusRow[]> => {
  const events = await fetchRecentSystemEvents(200);
  const baseMap = new Map<string, AgentStatusRow>();

  Object.keys(agentRegistry).forEach((name) => {
    baseMap.set(name, {
      name,
      status: "idle",
      lastRun: null,
      lastEvent: null,
    });
  });

  events.forEach((event) => {
    const agentName = event.agent_name ?? null;
    if (!agentName) {
      return;
    }

    const current = baseMap.get(agentName) ?? {
      name: agentName,
      status: "idle" as AgentStatus,
      lastRun: null,
      lastEvent: null,
    };

    if (isNewer(event.created_at, current.lastRun)) {
      baseMap.set(agentName, {
        name: agentName,
        status: deriveStatus(event.event_type),
        lastRun: event.created_at ?? current.lastRun,
        lastEvent: event.event_type ?? current.lastEvent,
      });
    }
  });

  return Array.from(baseMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export const triggerAgentRun = async (
  agentName: string,
  rawBody: unknown,
) => {
  const validatedName = AgentNameSchema.parse(agentName);
  const agent = agentRegistry[validatedName];

  if (!agentDescriptor) {
    throw new Error(`Agent ${requestedAgentName} is not registered`);
  }

  const parsedBody = AgentRunRequestSchema.parse(rawBody ?? {});
  const parsedInput = agent.inputSchema.parse(parsedBody.input ?? {});
  const startedAt = new Date().toISOString();

  await logSystemEvent({
    agent_name: requestedAgentName,
    event_type: "agent.start",
    payload: { trigger: "manual_api", input: validatedInput },
    created_at: startedAt,
  });

  try {
    console.log("Triggering agent run:", {
      agent: requestedAgentName,
      validatedInput,
    });

    const agentInstance = agentDescriptor.create();
    const result = await agentInstance.run(validatedInput);

    await logSystemEvent({
      agent_name: requestedAgentName,
      event_type: "agent.success",
      payload: { trigger: "manual_api", input: validatedInput },
      created_at: new Date().toISOString(),
    });

    return {
      message: `Agent ${requestedAgentName} started`,
      result,
    };
  } catch (error) {
    await logSystemEvent({
      agent_name: requestedAgentName,
      event_type: "agent.error",
      payload: {
        trigger: "manual_api",
        input: validatedInput,
        message: error instanceof Error ? error.message : String(error),
      },
      created_at: new Date().toISOString(),
    });

    throw error;
  }
};
