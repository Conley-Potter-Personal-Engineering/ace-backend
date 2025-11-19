import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

const scriptwriterOutputSchema = z.object({
  scriptText: z.string().trim().min(1, "Script text is required"),
  hook: z.string().trim().min(1, "Hook is required"),
  creativeVariables: z.object({
    emotion: z.string().trim().min(1, "Emotion is required"),
    structure: z.string().trim().min(1, "Structure is required"),
    style: z.string().trim().min(1, "Style is required"),
  }),
});

export type ScriptwriterParserOutput = z.infer<typeof scriptwriterOutputSchema>;

export const scriptwriterOutputParser = StructuredOutputParser.fromZodSchema(
  scriptwriterOutputSchema,
);
