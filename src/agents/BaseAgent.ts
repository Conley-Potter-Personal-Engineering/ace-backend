import type { Json, Tables } from "../db/types";
import { createAgentNote } from "../repos/agentNotes";
import { logSystemEvent } from "../repos/systemEvents";

export interface BaseAgentConfig {
  loggingEnabled?: boolean;
  defaultNoteImportance?: number | null;
  throttleMs?: number;
  [key: string]: unknown;
}

type EventSeverity = "debug" | "info" | "warning" | "error" | "critical";
type EventCategory = "workflow" | "agent" | "system" | "integration";

interface ExecutionContext {
  workflowId: string | null;
  correlationId: string | null;
}

export abstract class BaseAgent {
  protected readonly agentName: string;
  protected readonly config: BaseAgentConfig;
  private executionContext: ExecutionContext = {
    workflowId: null,
    correlationId: null,
  };

  constructor(agentName: string, config: BaseAgentConfig = {}) {
    this.agentName = agentName;
    this.config = config;
  }

  private inferEventCategory(eventType: string): EventCategory {
    if (eventType.startsWith("workflow.")) {
      return "workflow";
    }
    if (eventType.startsWith("integration.")) {
      return "integration";
    }
    if (eventType.startsWith("system.")) {
      return "system";
    }
    return "agent";
  }

  private inferSeverity(eventType: string): EventSeverity {
    if (eventType.includes("error")) {
      return "error";
    }
    if (eventType.includes("warning")) {
      return "warning";
    }
    return "info";
  }

  private inferMessage(eventType: string): string {
    return eventType
      .split(".")
      .join(" ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private extractContext(input: unknown): ExecutionContext {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return { workflowId: null, correlationId: null };
    }

    const payload = input as Record<string, unknown>;
    const workflowId =
      typeof payload.workflowId === "string" && payload.workflowId.trim()
        ? payload.workflowId.trim()
        : typeof payload.workflow_id === "string" && payload.workflow_id.trim()
        ? payload.workflow_id.trim()
        : null;

    const correlationId =
      typeof payload.correlationId === "string" && payload.correlationId.trim()
        ? payload.correlationId.trim()
        : typeof payload.correlation_id === "string" && payload.correlation_id.trim()
        ? payload.correlation_id.trim()
        : null;

    return { workflowId, correlationId };
  }

  protected async logEvent(
    eventType: string,
    payload?: Record<string, unknown>,
    options?: {
      severity?: EventSeverity;
      eventCategory?: EventCategory;
      message?: string;
      metadata?: Json | null;
    },
  ): Promise<Tables<"system_events"> | void> {
    if (this.config.loggingEnabled === false) {
      return;
    }

    return logSystemEvent({
      agent_name: this.agentName,
      event_type: eventType,
      workflow_id: this.executionContext.workflowId,
      correlation_id: this.executionContext.correlationId,
      event_category: options?.eventCategory ?? this.inferEventCategory(eventType),
      severity: options?.severity ?? this.inferSeverity(eventType),
      message: options?.message ?? this.inferMessage(eventType),
      metadata: options?.metadata ?? { source: "BaseAgent" },
      payload: (payload as any) ?? null,
      created_at: this.now(),
    });
  }

  async storeNote(
    topic: string,
    content: string,
    importance?: number,
    embedding?: string,
  ): Promise<Tables<"agent_notes">> {
    return createAgentNote({
      agent_name: this.agentName,
      topic,
      content,
      importance: importance ?? this.config.defaultNoteImportance ?? null,
      embedding: embedding ?? null,
      created_at: this.now(),
    });
  }

  protected async handleError(context: string, error: unknown): Promise<never> {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));

    try {
      await this.logEvent("error", {
        context,
        message: normalizedError.message,
        stack: normalizedError.stack,
      });
    } catch (loggingError) {
      console.error("Failed to log error event", loggingError);
    }

    throw normalizedError;
  }

  async execute(input: unknown): Promise<unknown> {
    this.executionContext = this.extractContext(input);

    try {
      await this.logEvent("agent.start", { input });
      const output = await this.run(input);
      await this.logEvent("agent.success", { input, output });
      return output;
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));

      try {
        await this.logEvent("agent.error", {
          input,
          message: normalizedError.message,
          stack: normalizedError.stack,
        });
      } catch (loggingError) {
        console.error("Failed to log agent.error event", loggingError);
      }

      throw normalizedError;
    } finally {
      this.executionContext = { workflowId: null, correlationId: null };
    }
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected now(): string {
    return new Date().toISOString();
  }

  abstract run(input: unknown): Promise<unknown>;
}

export default BaseAgent;
