import { jsonSchema, z } from "../repos/validators";

const CreativeVariablesSchema = z
  .object({
    emotion: z.string().trim().min(1, "Emotion is required"),
    structure: z.string().trim().min(1, "Structure is required"),
    style: z.string().trim().min(1, "Style is required"),
  })
  .catchall(jsonSchema);

export const ScriptInsertSchema = z.object({
  scriptId: z.string().uuid().optional(),
  productId: z.string().uuid("Product ID must be a valid UUID"),
  title: z.string().trim().min(1, "Title is required").nullable().optional(),
  scriptText: z.string().trim().min(1, "Script text is required"),
  hook: z.string().trim().min(1, "Hook is required"),
  cta: z.string().trim().min(1, "CTA is required").nullable().optional(),
  outline: z.string().trim().min(1, "Outline is required").nullable().optional(),
  creativeVariables: CreativeVariablesSchema,
  creativePatternId: z.string().uuid().nullable().optional(),
  trendReference: z.string().uuid().nullable().optional(),
  createdAt: z.string().datetime().nullable().optional(),
});

export type ScriptInsert = z.infer<typeof ScriptInsertSchema>;
