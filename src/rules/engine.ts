import type { AllergenRules, FoodCatalogItem, RecipeTemplate } from "../config/load-data.js";
import type { FoodStatusValue } from "../types/food.js";
import { allowedTexturesForAge } from "./texture.js";
import { pickMealsPerDay } from "./age-frequency.js";
import type { TextureRule, FeedingStage } from "../config/load-data.js";
import type { RuleAuditDecision } from "../storage/repositories/rule-audit.js";
import { recentReactionTriggersHardStop } from "./blocker.js";
import { shouldBlockNewFoodsInPlanner } from "./state-machine.js";
import type { FoodTrialRow } from "../storage/repositories/food-trial.js";

export type EngineAuditEntry = {
  rule_group: string;
  rule_key: string;
  decision: RuleAuditDecision;
  reason: string;
};

export type EngineInputs = {
  dob: string;
  week_start_monday: string;
  feedingStages: FeedingStage[];
  textureRules: TextureRule[];
  allergenRules: AllergenRules;
  foodCatalog: FoodCatalogItem[];
  recipeTemplates: RecipeTemplate[];
  foodStatus: Map<string, FoodStatusValue>;
  recent_trials: FoodTrialRow[];
};

export function runPrePlanChecks(input: EngineInputs): { audits: EngineAuditEntry[]; age_months: number; meals_per_day: number; allowed_textures: Set<string>; block_new_foods: boolean } {
  const audits: EngineAuditEntry[] = [];
  const age_months = computeAgeMonthsForWeek(input.dob, input.week_start_monday);

  const freq = pickMealsPerDay(input.feedingStages, age_months);
  audits.push({
    rule_group: "age_frequency",
    rule_key: "meals_per_day",
    decision: "allow",
    reason: `月龄约 ${age_months}：按 feeding-stages 选择每日辅食次数为 ${freq.meals_per_day}。${freq.stage_note ? `（${freq.stage_note}）` : ""}`,
  });

  const allowed_textures = allowedTexturesForAge(input.textureRules, age_months);
  audits.push({
    rule_group: "texture",
    rule_key: "allowed_textures",
    decision: "allow",
    reason: `月龄约 ${age_months}：允许质地集合为 [${[...allowed_textures].join(", ")}]。`,
  });

  let trialsHardStop = false;
  for (const t of input.recent_trials) {
    if (recentReactionTriggersHardStop({ severity: t.severity, reaction_text: t.reaction, allergenRules: input.allergenRules })) {
      trialsHardStop = true;
      audits.push({
        rule_group: "blocker",
        rule_key: "recent_severe_or_high_risk_symptom",
        decision: "block",
        reason: `近期进食记录存在严重反应或高风险症状关键词：暂停自动引入新食材（trial=${t.trial_id}）。`,
      });
      break;
    }
  }

  const observingBlock = shouldBlockNewFoodsInPlanner(input.foodStatus);
  if (observingBlock) {
    audits.push({
      rule_group: "blocker",
      rule_key: "observing_window",
      decision: "block",
      reason: "存在 OBSERVING 状态：为避免叠加新引入，暂停自动加入新食材。",
    });
  }

  return {
    audits,
    age_months,
    meals_per_day: freq.meals_per_day,
    allowed_textures,
    block_new_foods: trialsHardStop || observingBlock,
  };
}

function computeAgeMonthsForWeek(dobIso: string, weekStartMondayIso: string): number {
  const dob = new Date(`${dobIso}T12:00:00.000Z`);
  const weekStart = new Date(`${weekStartMondayIso}T12:00:00.000Z`);
  const ref = new Date(Math.max(dob.getTime(), weekStart.getTime()));
  const dob2 = new Date(`${dobIso}T12:00:00.000Z`);
  let months = (ref.getUTCFullYear() - dob2.getUTCFullYear()) * 12;
  months += ref.getUTCMonth() - dob2.getUTCMonth();
  if (ref.getUTCDate() < dob2.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

export function isIngredientBlockedByStatus(status: FoodStatusValue | undefined): boolean {
  if (!status) return false;
  return (
    status === "MANUAL_BLOCK" ||
    status === "SUSPECTED_ALLERGY_BLOCK" ||
    status === "SUSPECTED_INTOLERANCE" ||
    status === "OBSERVING" ||
    status === "PLANNED"
  );
}

export function templateIsAllowedByCatalog(
  t: RecipeTemplate,
  catalogById: Map<string, FoodCatalogItem>,
  ageMonths: number,
  allowedTextures: Set<string>,
): { ok: boolean; reason?: string } {
  if (!allowedTextures.has(t.texture)) {
    return { ok: false, reason: `菜谱质地 ${t.texture} 不在当前月龄允许集合内` };
  }
  for (const id of t.ingredients) {
    const item = catalogById.get(id);
    if (!item) return { ok: false, reason: `未知食材 id：${id}` };
    if (ageMonths < item.min_age_months) {
      return { ok: false, reason: `食材 ${item.name_zh}（${id}）最低引入月龄为 ${item.min_age_months}` };
    }
    if (!item.textures.includes(t.texture)) {
      return { ok: false, reason: `食材 ${item.name_zh} 与质地 ${t.texture} 不匹配（按食材库约束）` };
    }
  }
  return { ok: true };
}
