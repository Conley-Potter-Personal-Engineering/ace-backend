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
  scriptText: z.string().trim().min(1, "Script text is required"),
  hook: z.string().trim().min(1, "Hook is required"),
  creativeVariables: CreativeVariablesSchema,
  createdAt: z.string().datetime().nullable().optional(),
});

export type ScriptInsert = z.infer<typeof ScriptInsertSchema>;
