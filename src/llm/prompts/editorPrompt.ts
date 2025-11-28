import { PromptTemplate } from "@langchain/core/prompts";
import { editorOutputParser } from "../parsers/editorParser";

export interface EditorPromptInput {
  scriptText: string;
  hook: string;
  creativeVariables: string;
  storagePathHint: string;
}

const template = `
You are ACE's Editor Agent. Convert the provided script into a concise render plan and output file details for a short-form vertical video.

Constraints:
- Keep duration between 20-60 seconds.
- Each beat should map to a clear visual and narration moment.
- Assume a vertically oriented canvas.
- Favor confident, energetic pacing.

{format_instructions}

Script Hook:
{hook}

Script Body:
{scriptText}

Creative Variables / Style Guide:
{creativeVariables}

Preferred storage path (you may refine the filename but keep folder structure):
{storagePathHint}
`;

export const editorPromptTemplate = new PromptTemplate({
  template,
  inputVariables: [
    "scriptText",
    "hook",
    "creativeVariables",
    "format_instructions",
    "storagePathHint",
  ],
});

export const buildEditorPrompt = (
  input: EditorPromptInput,
): Promise<string> =>
  editorPromptTemplate.format({
    ...input,
    format_instructions: editorOutputParser.getFormatInstructions(),
  });
