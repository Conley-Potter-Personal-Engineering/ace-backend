import { z } from "zod";

export const AgentNameSchema = z.enum([
  "ScriptwriterAgent",
  "EditorAgent",
]);

export const AgentRunRequestSchema = z.object({
  input: z.unknown(),
});

export const WorkflowIdSchema = z.enum([
  "content-cycle",
  "trend-refresh",
  "publish-only",
  "optimization-cycle",
  "analytics-ingestion",
]);

export const WorkflowStartRequestSchema = z.object({
  input: z.unknown().optional(),
});

export const ArtifactsQuerySchema = z.object({
  type: z.enum(["video_prompt"]).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const ArtifactIdSchema = z.string().uuid("id must be a valid UUID");

export const FeedbackRequestSchema = z.object({
  artifact_id: z.string().uuid("artifact_id must be a valid UUID"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1, "comment is required"),
});

export const SystemEventsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export const LoginRequestSchema = z.object({
  email: z.string().email("email must be valid"),
  password: z.string().min(6, "password is required"),
});

export const SignupRequestSchema = z.object({
  email: z.string().email("email must be valid"),
  password: z.string().min(6, "password is required"),
});

export type AgentName = z.infer<typeof AgentNameSchema>;
export type WorkflowId = z.infer<typeof WorkflowIdSchema>;
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type SignupRequest = z.infer<typeof SignupRequestSchema>;
