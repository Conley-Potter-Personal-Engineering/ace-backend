import { z } from "zod";
import { ProductSchema } from "@/schemas/productsSchema";
import { CreativePatternSchema } from "@/schemas/patternsSchema";
import { TrendSnapshotSchema } from "@/schemas/trendsSchema";
import { ScriptWriterInput } from "@/schemas/scriptwriterSchemas";

const ScriptwriterEntityInputSchema = z.object({
  product: ProductSchema,
  pattern: CreativePatternSchema.nullable(),
  trend: TrendSnapshotSchema.nullable(),
});

const ScriptwriterSummaryInputSchema = ScriptWriterInput;

export const ScriptwriterPromptInputSchema = z.union([
  ScriptwriterEntityInputSchema,
  ScriptwriterSummaryInputSchema,
]);

export type ScriptwriterPromptInput = z.infer<typeof ScriptwriterPromptInputSchema>;

type ScriptwriterEntityInput = z.infer<typeof ScriptwriterEntityInputSchema>;
type ScriptwriterSummaryInput = z.infer<typeof ScriptwriterSummaryInputSchema>;

const isEntityInput = (
  input: ScriptwriterPromptInput,
): input is ScriptwriterEntityInput => "product" in input;

const pushListSection = (
  sections: string[],
  title: string,
  items: string[],
  emptyMessage: string,
): void => {
  sections.push(title);
  if (!items.length) {
    sections.push(`- ${emptyMessage}`);
  } else {
    items.forEach((item) => sections.push(`- ${item}`));
  }
  sections.push("");
};

const formatMetaList = (items?: string[] | null): string[] =>
  (items ?? []).map((item) => item.trim()).filter(Boolean);

const buildEntitySections = (
  input: ScriptwriterEntityInput,
  sections: string[],
): void => {
  const { product, pattern, trend } = input;

  sections.push("# Product Context");
  sections.push(`Product: ${product.name}`);
  sections.push(`Description: ${product.description ?? "N/A"}`);
  sections.push(`Category: ${product.category ?? "N/A"}`);
  sections.push("");

  const meta = product.meta ?? null;
  if (meta) {
    const keyFeatures = formatMetaList(meta.key_features);
    if (keyFeatures.length) {
      pushListSection(sections, "## Key Features", keyFeatures, "None provided.");
    }

    const demoIdeas = formatMetaList(meta.demo_ideas);
    if (demoIdeas.length) {
      pushListSection(sections, "## Demo Ideas", demoIdeas, "None provided.");
    }

    const objections = formatMetaList(meta.objections);
    if (objections.length) {
      pushListSection(
        sections,
        "## Objections to Address",
        objections,
        "None provided.",
      );
    }

    const compliance = formatMetaList(meta.compliance);
    if (compliance.length) {
      pushListSection(
        sections,
        "## Compliance Constraints",
        compliance,
        "None provided.",
      );
    }
  }

  sections.push("# Creative Pattern");
  if (pattern) {
    sections.push(`Structure: ${pattern.structure ?? "N/A"}`);
    sections.push(`Hook: ${pattern.hook_text ?? "N/A"}`);
    if (pattern.style_tags?.length) {
      sections.push(`Style: ${pattern.style_tags.join(", ")}`);
    }
    if (pattern.emotion_tags?.length) {
      sections.push(`Emotion: ${pattern.emotion_tags.join(", ")}`);
    }
    if (pattern.observed_performance) {
      sections.push(
        `Observed Performance: ${JSON.stringify(pattern.observed_performance)}`,
      );
    }
  } else {
    sections.push("No creative pattern provided.");
  }
  sections.push("");

  sections.push("# Trend Guidance");
  if (trend) {
    sections.push(`Popularity: ${trend.popularity_score}/100`);
    sections.push(`Velocity Score: ${trend.velocity_score}`);
    if (trend.tiktok_trend_tags?.length) {
      sections.push(`Incorporate these trends: ${trend.tiktok_trend_tags.join(", ")}`);
    }
  } else {
    sections.push("No trend snapshot provided.");
  }
  sections.push("");
};

const buildSummarySections = (
  input: ScriptwriterSummaryInput,
  sections: string[],
): void => {
  sections.push("# Product Context");
  sections.push(`Product: ${input.productId}`);
  sections.push(`Description: ${input.productSummary}`);
  sections.push("Category: N/A");
  sections.push("");

  pushListSection(
    sections,
    "# Creative Pattern Summaries",
    input.patternSummaries ?? [],
    "No creative patterns provided.",
  );

  pushListSection(
    sections,
    "# Trend Summaries",
    input.trendSummaries ?? [],
    "No trend summaries provided.",
  );

  const creativeVariables = Object.entries(input.creativeVariables ?? {}).map(
    ([key, value]) => `${key}: ${value}`,
  );
  pushListSection(
    sections,
    "# Creative Variables",
    creativeVariables,
    "No creative variables provided.",
  );
};

export const buildScriptwriterPrompt = (
  rawInput: ScriptwriterPromptInput,
): string => {
  const input = ScriptwriterPromptInputSchema.parse(rawInput);

  const sections: string[] = [
    "# System Role",
    "You are ACE's Scriptwriter agent. Create concise, high-impact short-form video scripts (15-60 seconds).",
    "",
  ];

  if (isEntityInput(input)) {
    buildEntitySections(input, sections);
  } else {
    buildSummarySections(input, sections);
  }

  sections.push("# Output Format");
  sections.push("Return JSON with:");
  sections.push("- title: string (short, descriptive title)");
  sections.push("- hook: string (opening line, 5-10 words)");
  sections.push("- outline: string[] (3-5 key beats)");
  sections.push("- script_text: string (full narration)");
  sections.push("- cta: string (clear call to action)");
  sections.push("- creative_variables: object (optional)");

  return sections.join("\n");
};
