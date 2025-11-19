import { z } from "zod";

const creativeVariablesSchema = z.object({
  emotion: z.string().trim().min(1, "Emotion is required"),
  structure: z.string().trim().min(1, "Structure is required"),
  style: z.string().trim().min(1, "Style is required"),
});

export const scriptInsertSchema = z.object({
  scriptId: z.string().uuid().optional(),
  productId: z.string().uuid("Product ID must be a valid UUID"),
  scriptText: z.string().trim().min(1, "Script text is required"),
  hook: z.string().trim().min(1, "Hook is required"),
  creativeVariables: creativeVariablesSchema,
  createdAt: z.string().datetime().nullable().optional(),
});

export type ScriptInsertDTO = z.infer<typeof scriptInsertSchema>;
