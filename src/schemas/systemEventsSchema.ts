import { z } from "zod";

const PayloadSchema = z.record(z.any());

export const SystemEventInputSchema = z.object({
  eventType: z.string().trim().min(1, "Event type is required"),
  agentName: z.string().trim().min(1).optional(),
  eventId: z.string().uuid().optional(),
  payload: PayloadSchema.optional(),
});

export type SystemEventInput = z.infer<typeof SystemEventInputSchema>;
