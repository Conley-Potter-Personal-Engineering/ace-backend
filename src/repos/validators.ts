import { z } from "zod";
import type { Json } from "../db/types";

export const identifierSchema = z
  .string()
  .min(1, "An identifier value is required")
  .trim();

export const nullableDateSchema = z.string().trim().nullable().optional();

export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(z.union([jsonSchema, z.undefined()])),
  ]),
);

export const stringArraySchema = z.array(z.string());

export { z };
