import { z } from "zod";

export const agentNameSchema = z.enum([
  "ScriptwriterAgent",
  "EditorAgent",
]);

export const agentRunRequestSchema = z.object({
  input: z.unknown(),
});

export const workflowIdSchema = z.enum([
  "content-cycle",
  "trend-refresh",
  "publish-only",
  "optimization-cycle",
  "analytics-ingestion",
]);

export const workflowStartRequestSchema = z.object({
  input: z.unknown().optional(),
});

export const artifactsQuerySchema = z.object({
  type: z.enum(["video_prompt"]).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const artifactIdSchema = z.string().uuid("id must be a valid UUID");

export const feedbackRequestSchema = z.object({
  artifact_id: z.string().uuid("artifact_id must be a valid UUID"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1, "comment is required"),
});

export const systemEventsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export type AgentName = z.infer<typeof agentNameSchema>;
export type WorkflowId = z.infer<typeof workflowIdSchema>;
export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;
