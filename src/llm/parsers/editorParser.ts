import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

const beatSchema = z.object({
  timestamp: z.string().trim().min(1, "Timestamp is required"),
  visual: z.string().trim().min(1, "Visual description is required"),
  narration: z.string().trim().min(1, "Narration summary is required"),
});

const editorOutputSchema = z.object({
  storagePath: z.string().trim().min(1, "Storage path is required"),
  thumbnailPath: z.string().trim().min(1).optional(),
  durationSeconds: z.number().int().positive().optional(),
  metadata: z.object({
    title: z.string().trim().min(1, "Title is required"),
    summary: z.string().trim().min(1, "Summary is required"),
    beats: z.array(beatSchema).min(1, "At least one beat is required"),
    soundtrack: z.string().trim().min(1).optional(),
    transitions: z.string().trim().min(1).optional(),
  }),
});

export type EditorParserOutput = z.infer<typeof editorOutputSchema>;

export const editorOutputParser = StructuredOutputParser.fromZodSchema(
  editorOutputSchema,
);
