import { z } from "zod";

export const scriptwriterAgentInputSchema = z.object({
  productId: z.string().uuid("productId must be a valid UUID"),
  productSummary: z
    .string()
    .trim()
    .min(1, "Product summary is required"),
  creativePatternId: z.string().uuid("creativePatternId must be a valid UUID"),
  trendSnapshotIds: z.array(z.string().uuid()).optional().default([]),
});

export type ScriptwriterAgentInput = z.infer<typeof scriptwriterAgentInputSchema>;

export const ScriptWriterInput = z.object({
  productId: z.string().uuid("productId must be a valid UUID"),
  productSummary: z.string().trim().min(1, "Product summary is required"),
  creativePatternId: z.string().uuid("creativePatternId must be a valid UUID"),
  trendSummaries: z.array(z.string().trim().min(1)).default([]),
});

export type ScriptWriterInputType = z.infer<typeof ScriptWriterInput>;

export const ScriptOutput = z.object({
  title: z.string(),
  hook: z.string(),
  cta: z.string(),
  outline: z.array(z.string()),
  body: z.string(),
});

export type ScriptOutputType = z.infer<typeof ScriptOutput>;

export const editorAgentInputSchema = z.object({
  scriptId: z.string().uuid("scriptId must be a valid UUID"),
  overrideStoragePath: z.string().trim().min(1).optional(),
});

export type EditorAgentInput = z.infer<typeof editorAgentInputSchema>;

export const editorChainOutputSchema = z.object({
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

export type EditorChainOutput = z.infer<typeof editorChainOutputSchema>;

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
