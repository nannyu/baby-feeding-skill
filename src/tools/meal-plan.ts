import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { DataBundle } from "../config/load-data.js";
import { mondayOfWeekUtc } from "../dates.js";
import { ageInMonths, isoDate } from "../dates.js";
import { getBabyProfile, getActiveBaby } from "../storage/repositories/baby-profile.js";
import { listFoodStatus } from "../storage/repositories/food-status.js";
import { insertMealPlanWithItems, listMealItems } from "../storage/repositories/meal-plan.js";
import { insertRuleAuditEntries } from "../storage/repositories/rule-audit.js";
import { listRecentTrials } from "../storage/repositories/food-trial.js";
import type { FoodStatusValue } from "../types/food.js";
import type { MealType } from "../types/meal.js";
import type { ActiveBabySummary, ToolResponse } from "../types/export.js";
import { RULES_VERSION } from "../version.js";
import { runPrePlanChecks } from "../rules/engine.js";
import { buildWeeklyMealPlan } from "../rules/meal-planner.js";

function mapStatuses(db: Database.Database, babyId: string): Map<string, FoodStatusValue> {
  const rows = listFoodStatus(db, babyId);
  const m = new Map<string, FoodStatusValue>();
  for (const r of rows) m.set(r.food_id, r.status);
  return m;
}

function summarizeActiveBaby(profile: NonNullable<ReturnType<typeof getBabyProfile>>): ActiveBabySummary {
  return {
    baby_id: profile.baby_id,
    nickname: profile.nickname,
    age_months: ageInMonths(profile.dob, isoDate(new Date())),
    weight_kg: profile.weight_kg ?? undefined,
    risk_level: profile.allergy_risk,
  };
}

export function generateWeeklyMealPlan(
  db: Database.Database,
  data: DataBundle,
  input: {
    baby_id?: string | null;
    week_start?: string | null;
    pantry?: string[] | null;
    constraints?: Record<string, unknown> | null;
  },
): ToolResponse & { plan_id: string; week_start: string } {
  void input.pantry;
  void input.constraints;

  const profile =
    (input.baby_id ? getBabyProfile(db, input.baby_id) : null) ?? getActiveBaby(db);
  if (!profile) {
    return {
      active_baby: null,
      week_plan: [],
      shopping_list: [],
      calendar_events: [],
      risk_flags: ["未找到宝宝档案：请先 create_or_update_baby_profile，或显式传入 baby_id。"],
      rule_audit_summary: [],
      plan_id: "",
      week_start: "",
    };
  }

  const week_start = mondayOfWeekUtc((input.week_start ?? isoDate(new Date())).slice(0, 10));
  const foodStatus = mapStatuses(db, profile.baby_id);
  const recent_trials = listRecentTrials(db, profile.baby_id, 30);

  const pre = runPrePlanChecks({
    dob: profile.dob,
    week_start_monday: week_start,
    feedingStages: data.feedingStages,
    textureRules: data.textureRules,
    allergenRules: data.allergenRules,
    foodCatalog: data.foodCatalog,
    recipeTemplates: data.recipeTemplates,
    foodStatus,
    recent_trials,
  });

  const planned = buildWeeklyMealPlan({
    week_start_monday: week_start,
    meals_per_day: pre.meals_per_day,
    allowed_textures: pre.allowed_textures,
    block_new_foods: pre.block_new_foods,
    food_catalog: data.foodCatalog,
    templates: data.recipeTemplates,
    food_status: foodStatus,
    age_months: pre.age_months,
  });

  const audits = [...pre.audits, ...planned.audits].map((a) => ({
    rule_group: a.rule_group,
    rule_key: a.rule_key,
    decision: a.decision,
    reason: a.reason,
  }));

  const plan_id = `plan_${randomUUID()}`;
  const items: Array<{ date: string; meal_type: MealType; slot: (typeof planned.days)[number]["meals"][number] }> = [];
  for (const day of planned.days) {
    for (const slot of day.meals) {
      items.push({ date: day.date, meal_type: slot.meal_type, slot });
    }
  }

  insertMealPlanWithItems(db, {
    plan_id,
    baby_id: profile.baby_id,
    week_start,
    source_version: RULES_VERSION,
    items,
  });

  const auditRows = [...pre.audits, ...planned.audits].map((a, idx) => ({
    audit_id: `audit_${plan_id}_${idx}`,
    plan_id,
    baby_id: profile.baby_id,
    rule_group: a.rule_group,
    rule_key: a.rule_key,
    decision: a.decision,
    reason: a.reason,
  }));
  insertRuleAuditEntries(db, auditRows);

  const risk_flags: string[] = [];
  if (pre.block_new_foods) {
    risk_flags.push("本周计划已启用「暂停自动引入新食材」保护：仅优先安排已耐受组合（若数据库中尚无耐受记录，菜单可能偏保守）。");
  }

  return {
    active_baby: summarizeActiveBaby(profile),
    week_plan: planned.days,
    shopping_list: [],
    calendar_events: [],
    risk_flags,
    rule_audit_summary: audits,
    plan_id,
    week_start,
  };
}

export function loadWeekPlanFromDb(db: Database.Database, planId: string) {
  const items = listMealItems(db, planId);
  const byDate = new Map<string, typeof items>();
  for (const it of items) {
    const arr = byDate.get(it.date) ?? [];
    arr.push(it);
    byDate.set(it.date, arr);
  }
  const dates = [...byDate.keys()].sort();
  return dates.map((date) => ({
    date,
    meals: (byDate.get(date) ?? []).map((it) => ({
      meal_type: it.meal_type,
      recipe_name: it.recipe_name,
      ingredients: it.ingredients,
      texture: it.texture,
      is_new_food: it.is_new_food,
      watch_points: it.watch_points,
      instructions: it.instructions,
    })),
  }));
}
