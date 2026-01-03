import { z } from "zod";

export const AgentNameSchema = z.enum([
  "ScriptwriterAgent",
  "EditorAgent",
  "PublisherAgent",
]);

export const AgentRunRequestSchema = z.object({
  input: z.unknown(),
});

const WorkflowContextSchema = z.object({
  workflow_id: z.string().uuid("workflow_id must be a valid UUID").optional(),
  correlation_id: z.string().uuid("correlation_id must be a valid UUID").optional(),
});

const WorkflowContextCamelSchema = z.object({
  workflowId: z.string().uuid("workflowId must be a valid UUID").optional(),
  correlationId: z.string().uuid("correlationId must be a valid UUID").optional(),
});

const normalizeWorkflowContext = (
  value: z.infer<typeof WorkflowContextSchema> | z.infer<typeof WorkflowContextCamelSchema>,
) => ({
  workflow_id:
    "workflow_id" in value ? value.workflow_id ?? undefined : value.workflowId ?? undefined,
  correlation_id:
    "correlation_id" in value
      ? value.correlation_id ?? undefined
      : value.correlationId ?? undefined,
});

const ScriptwriterGenerateSnakeSchema = WorkflowContextSchema.extend({
  product_id: z.string().uuid("product_id must be a valid UUID"),
  creative_pattern_id: z.string().uuid("creative_pattern_id must be a valid UUID"),
  trend_snapshot_id: z.string().uuid("trend_snapshot_id must be a valid UUID"),
});

const ScriptwriterGenerateCamelSchema = WorkflowContextCamelSchema.extend({
  productId: z.string().uuid("productId must be a valid UUID"),
  creativePatternId: z.string().uuid("creativePatternId must be a valid UUID"),
  trendSnapshotId: z.string().uuid("trendSnapshotId must be a valid UUID"),
});

export const ScriptwriterGenerateRequestSchema = z
  .union([ScriptwriterGenerateSnakeSchema, ScriptwriterGenerateCamelSchema])
  .transform((value) => ({
    ...normalizeWorkflowContext(value),
    product_id: "product_id" in value ? value.product_id : value.productId,
    creative_pattern_id:
      "creative_pattern_id" in value ? value.creative_pattern_id : value.creativePatternId,
    trend_snapshot_id:
      "trend_snapshot_id" in value ? value.trend_snapshot_id : value.trendSnapshotId,
  }));

const EditorRenderSnakeSchema = WorkflowContextSchema.extend({
  script_id: z.string().uuid("script_id must be a valid UUID"),
  override_storage_path: z.string().trim().min(1).optional(),
});

const EditorRenderCamelSchema = WorkflowContextCamelSchema.extend({
  scriptId: z.string().uuid("scriptId must be a valid UUID"),
  overrideStoragePath: z.string().trim().min(1).optional(),
});

export const EditorRenderRequestSchema = z.union([EditorRenderSnakeSchema, EditorRenderCamelSchema])
  .transform((value) => ({
    ...normalizeWorkflowContext(value),
    script_id: "script_id" in value ? value.script_id : value.scriptId,
    override_storage_path:
      "override_storage_path" in value
        ? value.override_storage_path
        : value.overrideStoragePath ?? undefined,
  }));

const PublisherPublishSnakeSchema = WorkflowContextSchema.extend({
  experiment_id: z.string().uuid("experiment_id must be a valid UUID"),
  platform: z.enum(["youtube", "tiktok", "instagram", "facebook", "linkedin", "x"]),
});

const PublisherPublishCamelSchema = WorkflowContextCamelSchema.extend({
  experimentId: z.string().uuid("experimentId must be a valid UUID"),
  platform: z.enum(["youtube", "tiktok", "instagram", "facebook", "linkedin", "x"]),
});

export const PublisherPublishRequestSchema = z
  .union([PublisherPublishSnakeSchema, PublisherPublishCamelSchema])
  .transform((value) => ({
    ...normalizeWorkflowContext(value),
    experiment_id: "experiment_id" in value ? value.experiment_id : value.experimentId,
    platform: value.platform,
  }));

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
export type ScriptwriterGenerateRequest = z.infer<typeof ScriptwriterGenerateRequestSchema>;
export type EditorRenderRequest = z.infer<typeof EditorRenderRequestSchema>;
export type PublisherPublishRequest = z.infer<typeof PublisherPublishRequestSchema>;
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type SignupRequest = z.infer<typeof SignupRequestSchema>;
