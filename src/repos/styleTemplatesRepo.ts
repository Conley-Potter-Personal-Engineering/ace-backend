import { getSupabase } from "@/db/db";
import { StyleTemplateSchema, type StyleTemplate } from "@/schemas/styleTemplateSchema";
import { identifierSchema, jsonSchema, z } from "./validators";

export type InsertStyleTemplateDTO = Omit<StyleTemplate, "id"> & { id?: string };
export type UpdateStyleTemplateDTO = Partial<InsertStyleTemplateDTO>;

type StyleTemplateRecord = {
  id: string;
  name: string;
  description: string | null;
  colors: unknown;
  fonts: unknown;
  transitions: unknown | null;
  metadata: unknown | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

const colorsSchema = z.object({
  primary: z.string().min(1),
  secondary: z.string().min(1),
  background: z.string().min(1),
});

const fontsSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
});

const transitionsSchema = z.array(z.string().min(1)).optional();

const styleTemplateInsertSchema = z.object({
  id: identifierSchema.optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  colors: colorsSchema,
  fonts: fontsSchema,
  transitions: transitionsSchema.nullable().optional(),
  metadata: jsonSchema.nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

const styleTemplateUpdateSchema = styleTemplateInsertSchema.partial();

export type StyleTemplateRepoErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "CREATE_FAILED"
  | "UPDATE_FAILED"
  | "DELETE_FAILED"
  | "QUERY_FAILED"
  | "UNKNOWN";

export class StyleTemplateRepoError extends Error {
  code: StyleTemplateRepoErrorCode;
  cause?: unknown;

  constructor(
    message: string,
    code: StyleTemplateRepoErrorCode = "UNKNOWN",
    cause?: unknown,
  ) {
    super(message);
    this.name = "StyleTemplateRepoError";
    this.code = code;
    this.cause = cause;
  }
}

const mapRecordToStyleTemplate = (record: StyleTemplateRecord): StyleTemplate =>
  StyleTemplateSchema.parse({
    id: record.id,
    name: record.name,
    description: record.description ?? undefined,
    colors: record.colors,
    fonts: record.fonts,
    transitions: record.transitions ?? undefined,
    metadata: (record.metadata ?? undefined) as Record<string, unknown> | undefined,
    isActive: record.is_active ?? true,
  });

const mapStyleTemplateToRecord = (template: InsertStyleTemplateDTO) => ({
  id: template.id,
  name: template.name,
  description: template.description ?? null,
  colors: template.colors,
  fonts: template.fonts,
  transitions: template.transitions ?? null,
  metadata: template.metadata ?? null,
  is_active: template.isActive ?? true,
  updated_at: new Date().toISOString(),
});

const mapStyleTemplateUpdate = (
  template: UpdateStyleTemplateDTO,
): Record<string, unknown> => {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if ("name" in template) updates.name = template.name;
  if ("description" in template) updates.description = template.description ?? null;
  if ("colors" in template) updates.colors = template.colors;
  if ("fonts" in template) updates.fonts = template.fonts;
  if ("transitions" in template) updates.transitions = template.transitions ?? null;
  if ("metadata" in template) updates.metadata = template.metadata ?? null;
  if ("isActive" in template) updates.is_active = template.isActive ?? true;

  return updates;
};

export const findById = async (id: string): Promise<StyleTemplate | null> => {
  try {
    const validatedId = identifierSchema.parse(id);
    const { data, error } = await getSupabase()
      .from("style_templates")
      .select("*")
      .eq("id", validatedId)
      .maybeSingle();

    if (error) {
      throw new StyleTemplateRepoError(
        `Failed to fetch style template ${validatedId}: ${error.message}`,
        "QUERY_FAILED",
        error,
      );
    }

    return data ? mapRecordToStyleTemplate(data as StyleTemplateRecord) : null;
  } catch (error) {
    if (error instanceof StyleTemplateRepoError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new StyleTemplateRepoError(
        "Style template lookup failed validation.",
        "VALIDATION",
        error,
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new StyleTemplateRepoError(message, "UNKNOWN", error);
  }
};

export const findAll = async (): Promise<StyleTemplate[]> => {
  try {
    const { data, error } = await getSupabase()
      .from("style_templates")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw new StyleTemplateRepoError(
        `Failed to list style templates: ${error.message}`,
        "QUERY_FAILED",
        error,
      );
    }

    return (data ?? []).map((record) =>
      mapRecordToStyleTemplate(record as StyleTemplateRecord),
    );
  } catch (error) {
    if (error instanceof StyleTemplateRepoError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new StyleTemplateRepoError(message, "UNKNOWN", error);
  }
};

export const create = async (
  payload: InsertStyleTemplateDTO,
): Promise<StyleTemplate> => {
  try {
    const validated = StyleTemplateSchema.parse(payload);
    const record = styleTemplateInsertSchema.parse({
      ...mapStyleTemplateToRecord(validated),
      created_at: new Date().toISOString(),
    });

    const { data, error } = await getSupabase()
      .from("style_templates")
      .insert(record)
      .select("*")
      .single();

    if (error) {
      throw new StyleTemplateRepoError(
        `Failed to create style template: ${error.message}`,
        "CREATE_FAILED",
        error,
      );
    }

    return mapRecordToStyleTemplate(data as StyleTemplateRecord);
  } catch (error) {
    if (error instanceof StyleTemplateRepoError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new StyleTemplateRepoError(
        "Style template creation failed validation.",
        "VALIDATION",
        error,
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new StyleTemplateRepoError(message, "UNKNOWN", error);
  }
};

export const update = async (
  id: string,
  payload: UpdateStyleTemplateDTO,
): Promise<StyleTemplate> => {
  try {
    const validatedId = identifierSchema.parse(id);
    const record = styleTemplateUpdateSchema.parse(mapStyleTemplateUpdate(payload));

    const { data, error } = await getSupabase()
      .from("style_templates")
      .update(record)
      .eq("id", validatedId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new StyleTemplateRepoError(
        `Failed to update style template ${validatedId}: ${error.message}`,
        "UPDATE_FAILED",
        error,
      );
    }

    if (!data) {
      throw new StyleTemplateRepoError(
        `Style template ${validatedId} not found`,
        "NOT_FOUND",
      );
    }

    return mapRecordToStyleTemplate(data as StyleTemplateRecord);
  } catch (error) {
    if (error instanceof StyleTemplateRepoError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new StyleTemplateRepoError(
        "Style template update failed validation.",
        "VALIDATION",
        error,
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new StyleTemplateRepoError(message, "UNKNOWN", error);
  }
};

export const deleteTemplate = async (id: string): Promise<void> => {
  try {
    const validatedId = identifierSchema.parse(id);
    const { error } = await getSupabase()
      .from("style_templates")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validatedId);

    if (error) {
      throw new StyleTemplateRepoError(
        `Failed to delete style template ${validatedId}: ${error.message}`,
        "DELETE_FAILED",
        error,
      );
    }
  } catch (error) {
    if (error instanceof StyleTemplateRepoError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new StyleTemplateRepoError(
        "Style template delete failed validation.",
        "VALIDATION",
        error,
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new StyleTemplateRepoError(message, "UNKNOWN", error);
  }
};
