import { z } from "zod";

export const experimentInputSchema = z.object({
  assetId: z.string().uuid().optional(),
  hypothesis: z.string().trim().min(1).optional(),
  productId: z.string().uuid().optional(),
  scriptId: z.string().uuid().optional(),
  variationLabel: z.string().trim().min(1).optional(),
});

export type ExperimentInputDTO = z.infer<typeof experimentInputSchema>;
