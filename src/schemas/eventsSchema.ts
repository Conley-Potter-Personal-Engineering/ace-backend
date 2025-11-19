import { z } from "zod";

const payloadSchema = z.record(z.any());

export const systemEventInputSchema = z.object({
  eventType: z.string().trim().min(1, "Event type is required"),
  agentName: z.string().trim().min(1).optional(),
  payload: payloadSchema.optional(),
});

export type SystemEventInputDTO = z.infer<typeof systemEventInputSchema>;
