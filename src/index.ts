export { RULES_VERSION } from "./version.js";
export { createRuntime, type BabyFeedingRuntime } from "./runtime.js";
export { openAndMigrate, openDatabase, runMigrations, type OpenDatabaseOptions } from "./storage/database.js";

export { createOrUpdateBabyProfile } from "./tools/profile.js";
export { generateWeeklyMealPlan, loadWeekPlanFromDb } from "./tools/meal-plan.js";
export { logFoodReaction } from "./tools/reaction-log.js";
export { exportCalendarIcs } from "./tools/export-ics.js";

export type { BabyProfile, AllergyRisk } from "./types/baby.js";
export type { FoodStatusValue, ReactionSeverity } from "./types/food.js";
export type { DayPlan, MealSlot, MealType } from "./types/meal.js";
export type { ToolResponse, ActiveBabySummary } from "./types/export.js";
