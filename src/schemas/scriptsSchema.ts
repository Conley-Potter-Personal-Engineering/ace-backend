import { z } from "../repos/validators";

export const scriptInsertSchema = z.object({
  scriptId: z.string().uuid().optional(),
  productId: z.string().uuid("Product ID must be a valid UUID"),
  scriptText: z.string().trim().min(1, "Script text is required"),
  hook: z.string().trim().min(1, "Hook is required"),
  creativePatternId: z
    .string()
    .uuid("Creative pattern ID must be a valid UUID"),
  trendReference: z
    .string()
    .uuid("Trend reference must be a valid UUID")
    .nullable()
    .optional(),
  createdAt: z.string().datetime().nullable().optional(),
});

export type ScriptInsertDTO = z.infer<typeof scriptInsertSchema>;
