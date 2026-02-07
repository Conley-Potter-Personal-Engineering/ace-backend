import { z } from "zod";


export const ScriptwriterAgentInputSchema = z.object({
  productId: z.string().uuid("productId must be a valid UUID"),
  creativePatternId: z.string().uuid("creativePatternId must be a valid UUID"),
  trendSnapshotId: z.string().uuid("trendSnapshotId must be a valid UUID"),
  workflowId: z.string().uuid("workflowId must be a valid UUID").optional(),
  correlationId: z.string().uuid("correlationId must be a valid UUID").optional(),
});

export type ScriptwriterAgentInput = z.infer<typeof ScriptwriterAgentInputSchema>;

export const ScriptWriterInput = ScriptwriterAgentInputSchema;

export type ScriptWriterInputType = ScriptwriterAgentInput;

export const ScriptOutput = z.object({
  title: z.string(),
  hook: z.string(),
  cta: z.string(),
  outline: z.array(z.string()),
  body: z.string(),
});

export type ScriptOutputType = z.infer<typeof ScriptOutput>;

export const EditorAgentInputSchema = z.object({
  scriptId: z.string().uuid("scriptId must be a valid UUID"),
  overrideStoragePath: z.string().trim().min(1).optional(),
});

export type EditorAgentInput = z.infer<typeof EditorAgentInputSchema>;

export const EditorChainOutputSchema = z.object({
  storagePath: z.string().trim().min(1, "Storage path is required"),
  durationSeconds: z.number().int().positive().optional(),
  thumbnailPath: z.string().trim().min(1).optional(),
  metadata: z.object({
    title: z.string().trim().min(1, "Title is required"),
    summary: z.string().trim().min(1, "Summary is required"),
    beats: z.array(
      z.object({
        timestamp: z.string().trim().min(1),
        visual: z.string().trim().min(1),
        narration: z.string().trim().min(1),
      }),
    ),
    soundtrack: z.string().trim().min(1).optional(),
    transitions: z.string().trim().min(1).optional(),
  }),
});

export type EditorChainOutput = z.infer<typeof EditorChainOutputSchema>;

export const StyleTemplateSchema = z.object({
  id: z.string().uuid("id must be a valid UUID").optional(),
  name: z.string().trim().min(1, "Template name is required"),
  description: z.string().trim().optional(),
  colors: z.object({
    primary: z.string().trim().min(1, "Primary color is required"),
    secondary: z.string().trim().min(1, "Secondary color is required"),
    background: z.string().trim().min(1, "Background color is required"),
  }),
  fonts: z.object({
    title: z.string().trim().min(1, "Title font is required"),
    body: z.string().trim().min(1, "Body font is required"),
  }),
  transitions: z.array(z.string().trim().min(1)).optional(),
  branding: z
    .object({
      logoUrl: z.string().trim().url().optional(),
      watermarkText: z.string().trim().min(1).optional(),
    })
    .optional(),
  metadata: z.record(z.unknown()).optional(),
  isActive: z.boolean().default(true),
});

export type StyleTemplate = z.infer<typeof StyleTemplateSchema>;

export const EditorRequestSchema = z.object({
  scriptId: z.string().uuid("scriptId must be a valid UUID"),
  composition: z.object({
    duration: z.number().positive("Duration must be positive"),
    tone: z.string().trim().min(1, "Tone is required"),
    layout: z.string().trim().min(1, "Layout is required"),
  }),
  styleTemplateId: z.string().trim().min(1).optional(),
  renderBackend: z
    .enum(["local", "s3", "supabase"])
    .default("supabase"),
});

export type EditorRequest = z.infer<typeof EditorRequestSchema>;

export const VideoAssetSchema = z.object({
  id: z.string().uuid("id must be a valid UUID").optional(),
  scriptId: z.string().uuid("scriptId must be a valid UUID"),
  storageUrl: z.string().url("storageUrl must be a valid URL"),
  duration: z.number().positive("Duration must be positive"),
  tone: z.string().trim().min(1, "Tone is required"),
  layout: z.string().trim().min(1, "Layout is required"),
  styleTags: z.array(z.string().trim().min(1)).optional(),
});

export type VideoAsset = z.infer<typeof VideoAssetSchema>;
export const PublishPlatformSchema = z.object({
  platform: z.enum(["youtube", "tiktok", "instagram", "facebook", "linkedin", "x"]),
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
});

export type PublishPlatform = z.infer<typeof PublishPlatformSchema>;

export const PublishRequestSchema = z
  .object({
    assetId: z.string().uuid("assetId must be a valid UUID").optional(),
    experimentId: z.string().uuid("experimentId must be a valid UUID").optional(),
    scriptId: z.string().uuid("scriptId must be a valid UUID").optional(),
    productId: z.string().uuid("productId must be a valid UUID").optional(),
    videoUrl: z.string().url("videoUrl must be a valid URL").optional(),
    platforms: z
      .array(PublishPlatformSchema)
      .default([]),
  })
  .superRefine((value, ctx) => {
    if (!value.assetId && !value.experimentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either assetId or experimentId must be provided",
        path: ["assetId"],
      });
    }
  });

export type PublishRequest = z.infer<typeof PublishRequestSchema>;

export const PublishResultSchema = z.object({
  platform: PublishPlatformSchema.shape.platform,
  status: z.literal("published"),
  url: z.string().url("url must be a valid URL"),
  externalId: z.string().trim().min(1, "externalId is required"),
  publishedAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "publishedAt must be a valid ISO date"),
  notes: z.string().trim().optional(),
});

export type PublishResult = z.infer<typeof PublishResultSchema>;
