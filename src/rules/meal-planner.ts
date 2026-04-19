import type { FoodCatalogItem, RecipeTemplate } from "../config/load-data.js";
import type { FoodStatusValue } from "../types/food.js";
import type { DayPlan, MealSlot, MealType } from "../types/meal.js";
import { addDaysUtc } from "../dates.js";
import { pickMealTypes } from "./diversity.js";
import { isIngredientBlockedByStatus, templateIsAllowedByCatalog, type EngineAuditEntry } from "./engine.js";

function statusForIngredient(foodStatus: Map<string, FoodStatusValue>, foodId: string): FoodStatusValue {
  return foodStatus.get(foodId) ?? "UNTRIED";
}

function templateHasNewIngredient(t: RecipeTemplate, foodStatus: Map<string, FoodStatusValue>): boolean {
  return t.ingredients.some((id) => {
    const s = statusForIngredient(foodStatus, id);
    return s === "UNTRIED";
  });
}

function templateHasHighAllergenNew(t: RecipeTemplate, catalogById: Map<string, FoodCatalogItem>, foodStatus: Map<string, FoodStatusValue>): boolean {
  return t.ingredients.some((id) => {
    const item = catalogById.get(id);
    if (!item?.high_allergen) return false;
    const s = statusForIngredient(foodStatus, id);
    return s === "UNTRIED";
  });
}

function scoreTemplate(t: RecipeTemplate, foodStatus: Map<string, FoodStatusValue>): number {
  let score = 0;
  for (const id of t.ingredients) {
    const s = statusForIngredient(foodStatus, id);
    if (s === "UNTRIED") score += 2;
    if (s === "DISLIKED") score += 6;
    if (s === "TOLERATED") score += 0;
  }
  return score;
}

function pickTemplateForSlot(input: {
  meal_type: MealType;
  dayIndex: number;
  candidates: RecipeTemplate[];
  foodStatus: Map<string, FoodStatusValue>;
  catalogById: Map<string, FoodCatalogItem>;
  block_new_foods: boolean;
  allow_new_today: boolean;
  mode: "normal" | "tolerated_only";
}): { template: RecipeTemplate; is_new_food: boolean; audits: EngineAuditEntry[] } | null {
  const audits: EngineAuditEntry[] = [];
  const fitsMeal = input.candidates.filter((t) => t.meal_types.includes(input.meal_type));
  const fitsMode =
    input.mode === "tolerated_only"
      ? fitsMeal.filter((t) => t.ingredients.every((id) => statusForIngredient(input.foodStatus, id) === "TOLERATED"))
      : fitsMeal;
  const rotated = [...fitsMode].sort((a, b) => {
    const sa = scoreTemplate(a, input.foodStatus);
    const sb = scoreTemplate(b, input.foodStatus);
    if (sa !== sb) return sa - sb;
    return a.recipe_name.localeCompare(b.recipe_name, "zh");
  });

  for (const t of rotated) {
    const isNew = templateHasNewIngredient(t, input.foodStatus);
    const isHighAllergenNew = templateHasHighAllergenNew(t, input.catalogById, input.foodStatus);

    if (input.mode === "tolerated_only") {
      return { template: t, is_new_food: false, audits };
    }

    if (input.block_new_foods && isNew) {
      continue;
    }
    if (isNew && !input.allow_new_today) {
      continue;
    }
    if (isHighAllergenNew) {
      audits.push({
        rule_group: "allergen",
        rule_key: "high_allergen_intro",
        decision: "allow",
        reason: `菜谱「${t.recipe_name}」包含高敏食材的新引入：已安排在白天餐次并附带观察要点（MVP 仍需家长监护）。`,
      });
    }

    return { template: t, is_new_food: isNew, audits };
  }

  return null;
}

function toMealSlot(t: RecipeTemplate, catalogById: Map<string, FoodCatalogItem>, meal_type: MealType, is_new_food: boolean): MealSlot {
  const watch = [...(t.watch_points ?? [])];
  const names = t.ingredients.map((id) => catalogById.get(id)?.name_zh ?? id);
  return {
    meal_type,
    recipe_name: t.recipe_name,
    ingredients: names,
    texture: t.texture,
    is_new_food,
    watch_points: watch,
    instructions: t.instructions,
  };
}

export function buildWeeklyMealPlan(input: {
  week_start_monday: string;
  meals_per_day: number;
  allowed_textures: Set<string>;
  block_new_foods: boolean;
  food_catalog: FoodCatalogItem[];
  templates: RecipeTemplate[];
  food_status: Map<string, FoodStatusValue>;
  age_months: number;
}): { days: DayPlan[]; audits: EngineAuditEntry[] } {
  const catalogById = new Map(input.food_catalog.map((f) => [f.id, f]));
  const audits: EngineAuditEntry[] = [];

  const candidates = input.templates.filter((t) => {
    const gate = templateIsAllowedByCatalog(t, catalogById, input.age_months, input.allowed_textures);
    if (!gate.ok) return false;
    for (const id of t.ingredients) {
      if (isIngredientBlockedByStatus(input.food_status.get(id))) return false;
    }
    return true;
  });

  if (candidates.length === 0) {
    audits.push({
      rule_group: "diversity",
      rule_key: "no_candidate_templates",
      decision: "block",
      reason: "没有可用菜谱模板（可能被质地/月龄/禁用状态过滤）。请扩充食材库或调整状态后再生成。",
    });
    return { days: [], audits };
  }

  const mealTypes = pickMealTypes(input.meals_per_day);
  const days: DayPlan[] = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const date = addDaysUtc(input.week_start_monday, dayIndex);
    const meals: MealSlot[] = [];

    let allow_new_today = dayIndex % 2 === 1;
    if (input.block_new_foods) allow_new_today = false;

    for (const meal_type of mealTypes) {
      const picked =
        pickTemplateForSlot({
          meal_type,
          dayIndex,
          candidates,
          foodStatus: input.food_status,
          catalogById,
          block_new_foods: input.block_new_foods,
          allow_new_today,
          mode: "normal",
        }) ??
        pickTemplateForSlot({
          meal_type,
          dayIndex,
          candidates,
          foodStatus: input.food_status,
          catalogById,
          block_new_foods: input.block_new_foods,
          allow_new_today,
          mode: "tolerated_only",
        });

      if (!picked) {
        audits.push({
          rule_group: "diversity",
          rule_key: "no_fit_for_slot",
          decision: "adjust",
          reason: `无法在 ${date} ${meal_type} 找到符合约束的菜谱（可能新食材被阻断或当日已不允许新引入）。`,
        });
        continue;
      }

      audits.push(...picked.audits);
      if (picked.is_new_food) allow_new_today = false;

      meals.push(toMealSlot(picked.template, catalogById, meal_type, picked.is_new_food));
    }

    days.push({ date, meals });
  }

  return { days, audits };
}
