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
) => {
  const snake = value as z.infer<typeof WorkflowContextSchema>;
  const camel = value as z.infer<typeof WorkflowContextCamelSchema>;

  return {
    workflow_id: "workflow_id" in value ? snake.workflow_id : camel.workflowId,
    correlation_id:
      "correlation_id" in value ? snake.correlation_id : camel.correlationId,
  };
};

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
  .transform((value) => {
    const productId = "product_id" in value ? value.product_id : value.productId;
    const creativePatternId =
      "creative_pattern_id" in value ? value.creative_pattern_id : value.creativePatternId;
    const trendSnapshotId =
      "trend_snapshot_id" in value ? value.trend_snapshot_id : value.trendSnapshotId;

    return {
      ...normalizeWorkflowContext(value),
      product_id: productId,
      creative_pattern_id: creativePatternId,
      trend_snapshot_id: trendSnapshotId,
    };
  });

const EditorRenderSnakeSchema = WorkflowContextSchema.extend({
  script_id: z.string().uuid("script_id must be a valid UUID"),
  override_storage_path: z.string().trim().min(1).optional(),
});

const EditorRenderCamelSchema = WorkflowContextCamelSchema.extend({
  scriptId: z.string().uuid("scriptId must be a valid UUID"),
  overrideStoragePath: z.string().trim().min(1).optional(),
});

export const EditorRenderRequestSchema = z
  .union([EditorRenderSnakeSchema, EditorRenderCamelSchema])
  .transform((value) => {
    const snake = value as z.infer<typeof EditorRenderSnakeSchema>;
    const camel = value as z.infer<typeof EditorRenderCamelSchema>;
    const scriptId = "script_id" in value ? snake.script_id : camel.scriptId;
    const overrideStoragePath =
      "override_storage_path" in value
        ? snake.override_storage_path
        : camel.overrideStoragePath ?? undefined;

    return {
      ...normalizeWorkflowContext(value),
      script_id: scriptId,
      override_storage_path: overrideStoragePath,
    };
  });

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
  .transform((value) => {
    const experimentId =
      "experiment_id" in value ? value.experiment_id : value.experimentId;
    return {
      ...normalizeWorkflowContext(value),
      experiment_id: experimentId,
      platform: value.platform,
    };
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

const BooleanQuerySchema = z
  .union([z.literal("true"), z.literal("false"), z.boolean()])
  .transform((value) => value === true || value === "true");

const DateTimeQuerySchema = z.string().datetime();

const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const ExperimentsListQuerySchema = PaginationQuerySchema.extend({
  product_id: z.string().uuid("product_id must be a valid UUID").optional(),
  start_date: DateTimeQuerySchema.optional(),
  end_date: DateTimeQuerySchema.optional(),
  has_performance: BooleanQuerySchema.optional(),
  min_score: z.coerce.number().optional(),
  max_score: z.coerce.number().optional(),
  sort: z
    .enum([
      "created_at_desc",
      "created_at_asc",
      "score_desc",
      "score_asc",
    ])
    .optional(),
});

export const ExperimentIdParamSchema = z.string().uuid("id must be a valid UUID");

export const ScriptsListQuerySchema = PaginationQuerySchema.extend({
  product_id: z.string().uuid("product_id must be a valid UUID").optional(),
  start_date: DateTimeQuerySchema.optional(),
  end_date: DateTimeQuerySchema.optional(),
  has_experiments: BooleanQuerySchema.optional(),
  sort: z.enum(["created_at_desc", "created_at_asc", "title_asc"]).optional(),
});

export const VideosListQuerySchema = ScriptsListQuerySchema;

export const PostsListQuerySchema = ScriptsListQuerySchema.extend({
  platform: z.enum(["instagram", "tiktok", "youtube"]).optional(),
  experiment_id: z.string().uuid("experiment_id must be a valid UUID").optional(),
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
