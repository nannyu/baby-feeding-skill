import { describe, expect, it } from "vitest";
import { runPrePlanChecks } from "../../src/rules/engine.js";
import { loadDataBundle } from "../../src/config/load-data.js";

const data = loadDataBundle(import.meta.url);

describe("runPrePlanChecks", () => {
  it("computes meals per day and textures for a 7-month baby", () => {
    const foodStatus = new Map<string, import("../../src/types/food.js").FoodStatusValue>();
    const res = runPrePlanChecks({
      dob: "2025-09-19",
      week_start_monday: "2026-04-20",
      feedingStages: data.feedingStages,
      textureRules: data.textureRules,
      allergenRules: data.allergenRules,
      foodCatalog: data.foodCatalog,
      recipeTemplates: data.recipeTemplates,
      foodStatus,
      recent_trials: [],
    });
    expect(res.age_months).toBeGreaterThanOrEqual(6);
    expect(res.meals_per_day).toBeGreaterThanOrEqual(2);
    expect(res.allowed_textures.has("smooth_puree")).toBe(true);
  });
});
