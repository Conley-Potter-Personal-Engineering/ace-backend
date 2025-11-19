import { getSupabase } from "../db/db";
import type { Tables, TablesInsert, TablesUpdate } from "../db/types";
import {
  identifierSchema,
  jsonSchema,
  nullableDateSchema,
  z,
} from "./validators";

const productInsertSchema = z.object({
  affiliate_link: z.string().trim().nullable().optional(),
  category: z.string().trim().nullable().optional(),
  created_at: nullableDateSchema,
  description: z.string().trim().nullable().optional(),
  image_url: z.string().trim().nullable().optional(),
  meta: jsonSchema.nullable().optional(),
  name: z.string().min(1, "Product name is required"),
  product_id: identifierSchema.optional(),
  source_platform: z.string().min(1, "Source platform is required"),
  updated_at: nullableDateSchema,
});

const productUpdateSchema = productInsertSchema.partial();

const productIdSchema = identifierSchema.describe("product_id");

export const createProduct = async (payload: TablesInsert<"products">) => {
  const validated = productInsertSchema.parse(payload);
  const { data, error } = await getSupabase()
    .from("products")
    .insert(validated)
    .select("*")
    .returns<Tables<"products">[]>()
    .single();

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`);
  }

  return data;
};

export const listProducts = async () => {
  const { data, error } = await getSupabase()
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Tables<"products">[]>();

  if (error) {
    throw new Error(`Failed to list products: ${error.message}`);
  }

  return data ?? [];
};

export const getProductById = async (productId: string) => {
  const validatedId = productIdSchema.parse(productId);
  const { data, error } = await getSupabase()
    .from("products")
    .select("*")
    .eq("product_id", validatedId)
    .returns<Tables<"products">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch product with id ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const updateProduct = async (
  productId: string,
  changes: TablesUpdate<"products">,
) => {
  const validatedId = productIdSchema.parse(productId);
  const validatedChanges = productUpdateSchema.parse(changes);
  const { data, error } = await getSupabase()
    .from("products")
    .update(validatedChanges)
    .eq("product_id", validatedId)
    .select("*")
    .returns<Tables<"products">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to update product ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const deleteProduct = async (productId: string) => {
  const validatedId = productIdSchema.parse(productId);
  const { data, error } = await getSupabase()
    .from("products")
    .delete()
    .eq("product_id", validatedId)
    .select("*")
    .returns<Tables<"products">[]>()
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to delete product ${validatedId}: ${error.message}`,
    );
  }

  return data;
};

export const listProductsByCategory = async (category: string) => {
  const validatedCategory = identifierSchema.parse(category);
  const { data, error } = await getSupabase()
    .from("products")
    .select("*")
    .eq("category", validatedCategory)
    .returns<Tables<"products">[]>();

  if (error) {
    throw new Error(
      `Failed to list products for category ${validatedCategory}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const listProductsForPlatform = async (platform: string) => {
  const validatedPlatform = identifierSchema.parse(platform);
  const { data, error } = await getSupabase()
    .from("products")
    .select("*")
    .eq("source_platform", validatedPlatform)
    .returns<Tables<"products">[]>();

  if (error) {
    throw new Error(
      `Failed to list products for platform ${validatedPlatform}: ${error.message}`,
    );
  }

  return data ?? [];
};

export const searchProductsByName = async (searchTerm: string) => {
  const validatedTerm = identifierSchema.parse(searchTerm);
  const { data, error } = await getSupabase()
    .from("products")
    .select("*")
    .ilike("name", `%${validatedTerm}%`)
    .returns<Tables<"products">[]>();

  if (error) {
    throw new Error(
      `Failed to search products matching ${validatedTerm}: ${error.message}`,
    );
  }

  return data ?? [];
};
