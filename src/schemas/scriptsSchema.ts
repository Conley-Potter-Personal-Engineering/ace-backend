import { z } from "zod";

const metadataSchema = z.record(z.any());

export const scriptInputSchema = z.object({
  productId: z.string().uuid().optional(),
  scriptText: z.string().trim().min(1, "Script text is required"),
  hook: z.string().trim().min(1).optional(),
  creativeVariables: metadataSchema.optional(),
});

export type ScriptInputDTO = z.infer<typeof scriptInputSchema>;
