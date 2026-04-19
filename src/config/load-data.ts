import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { dataDir } from "./paths.js";

const FoodCatalogItemSchema = z.object({
  id: z.string(),
  name_zh: z.string(),
  min_age_months: z.number(),
  textures: z.array(z.string()),
  high_allergen: z.boolean(),
  choking_risk_if: z.array(z.string()).optional(),
});

const FeedingStageSchema = z.object({
  min_age_months: z.number(),
  max_age_months_exclusive: z.number().nullable(),
  meals_per_day: z.number(),
  notes_zh: z.string().optional(),
});

const TextureRuleSchema = z.object({
  min_age_months: z.number(),
  max_age_months_exclusive: z.number().nullable(),
  allowed_textures: z.array(z.string()),
  notes_zh: z.string().optional(),
});

const AllergenRulesSchema = z.object({
  high_risk_symptoms_zh: z.array(z.string()),
  high_risk_symptoms_en: z.array(z.string()).optional(),
  observation_days_after_new_high_allergen: z.number(),
  notes_zh: z.string().optional(),
});

const RecipeTemplateSchema = z.object({
  recipe_name: z.string(),
  ingredients: z.array(z.string()),
  texture: z.string(),
  meal_types: z.array(z.string()),
  instructions: z.string(),
  watch_points: z.array(z.string()).optional(),
});

export type FoodCatalogItem = z.infer<typeof FoodCatalogItemSchema>;
export type FeedingStage = z.infer<typeof FeedingStageSchema>;
export type TextureRule = z.infer<typeof TextureRuleSchema>;
export type AllergenRules = z.infer<typeof AllergenRulesSchema>;
export type RecipeTemplate = z.infer<typeof RecipeTemplateSchema>;

export type DataBundle = {
  foodCatalog: FoodCatalogItem[];
  feedingStages: FeedingStage[];
  textureRules: TextureRule[];
  allergenRules: AllergenRules;
  recipeTemplates: RecipeTemplate[];
};

function readJson<T>(importMetaUrl: string, file: string, schema: z.ZodType<T>): T {
  const full = path.join(dataDir(importMetaUrl), file);
  const raw = JSON.parse(fs.readFileSync(full, "utf8"));
  return schema.parse(raw);
}

export function loadDataBundle(importMetaUrl: string): DataBundle {
  return {
    foodCatalog: readJson(importMetaUrl, "food-catalog.json", z.array(FoodCatalogItemSchema)),
    feedingStages: readJson(importMetaUrl, "feeding-stages.json", z.array(FeedingStageSchema)),
    textureRules: readJson(importMetaUrl, "texture-rules.json", z.array(TextureRuleSchema)),
    allergenRules: readJson(importMetaUrl, "allergen-rules.json", AllergenRulesSchema),
    recipeTemplates: readJson(importMetaUrl, "recipe-templates.json", z.array(RecipeTemplateSchema)),
  };
}
