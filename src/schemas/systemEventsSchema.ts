import { z } from "zod";

const PayloadSchema = z.record(z.any());

const EventCategorySchema = z.enum([
  "workflow",
  "agent",
  "system",
  "integration",
]);

const SeveritySchema = z.enum([
  "debug",
  "info",
  "warning",
  "error",
  "critical",
]);

const MAX_METADATA_BYTES = 10 * 1024;

const MetadataSchema = PayloadSchema.superRefine((value, ctx) => {
  try {
    const serialized = JSON.stringify(value);
    const size = Buffer.byteLength(serialized, "utf8");
    if (size > MAX_METADATA_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "metadata must be 10KB or smaller",
      });
    }
  } catch (error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "metadata must be JSON serializable",
    });
  }
});

export const SystemEventCreateSchema = z.object({
  event_type: z.string().trim().min(1, "event_type is required").max(100),
  event_category: EventCategorySchema,
  severity: SeveritySchema,
  message: z.string().trim().min(1, "message is required").max(500),
  workflow_id: z.string().trim().min(1).max(100).optional(),
  correlation_id: z.string().trim().min(1).max(100).optional(),
  agent_name: z.string().trim().min(1).max(100).optional(),
  metadata: MetadataSchema.optional(),
});

export type SystemEventCreateInput = z.infer<typeof SystemEventCreateSchema>;

export const SystemEventInputSchema = z.object({
  eventType: z.string().trim().min(1, "Event type is required"),
  agentName: z.string().trim().min(1).optional(),
  eventId: z.string().uuid().optional(),
  correlation_id: z.string().uuid().optional(),
  workflow_id: z.string().uuid(),
  payload: PayloadSchema.optional(),
});

export type SystemEventInput = z.infer<typeof SystemEventInputSchema>;
