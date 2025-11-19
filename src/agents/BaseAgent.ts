import type { Tables } from "../db/types";
import { createAgentNote } from "../repos/agentNotes";
import { logSystemEvent } from "../repos/systemEvents";

export interface BaseAgentConfig {
  loggingEnabled?: boolean;
  defaultNoteImportance?: number | null;
  throttleMs?: number;
  [key: string]: unknown;
}

export abstract class BaseAgent {
  protected readonly agentName: string;
  protected readonly config: BaseAgentConfig;

  constructor(agentName: string, config: BaseAgentConfig = {}) {
    this.agentName = agentName;
    this.config = config;
  }

  protected async logEvent(
    eventType: string,
    payload?: Record<string, unknown>,
  ): Promise<Tables<"system_events"> | void> {
    if (this.config.loggingEnabled === false) {
      return;
    }

    return logSystemEvent({
      agent_name: this.agentName,
      event_type: eventType,
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
    try {
      await this.logEvent("start", { input });
      const output = await this.run(input);
      await this.logEvent("success", { input, output });
      return output;
    } catch (error) {
      return this.handleError("execute", error);
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
