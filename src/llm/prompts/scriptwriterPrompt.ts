import { PromptTemplate } from "@langchain/core/prompts";
import { scriptwriterOutputParser } from "../parsers/scriptwriterParser";

export interface ScriptwriterPromptInput {
  productName: string;
  productDescription: string;
  category: string;
  notes: string;
}

export const scriptwriterPromptTemplate = new PromptTemplate({
  template: `
You are ACE's Scriptwriter. Craft concise, high-impact short-form video scripts that educate and persuade viewers.

Constraints:
- Focus on short-form mobile-first formats (15–60 seconds).
- Keep narration energetic and tightly paced.
- Ground every idea in the product details and notes.

{format_instructions}

Product Context:
- Name: {productName}
- Description: {productDescription}
- Category: {category}

Reference Notes (prioritize compelling insights):
{notes}
`,
  inputVariables: [
    "productName",
    "productDescription",
    "category",
    "notes",
    "format_instructions",
  ],
});


export const buildScriptwriterPrompt = (
  input: ScriptwriterPromptInput,
): Promise<string> =>
  scriptwriterPromptTemplate.format({
    ...input,
    format_instructions: scriptwriterOutputParser.getFormatInstructions(),
  });
