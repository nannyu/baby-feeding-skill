import type { AllergenRules } from "../config/load-data.js";
import type { ReactionSeverity } from "../types/food.js";
import { matchesHighRiskSymptom } from "./allergen.js";

export type BlockAssessment = {
  block_new_foods: boolean;
  reasons: string[];
};

export function assessGlobalBlocks(input: {
  recent_severe_or_symptom: boolean;
  blocked_food_count: number;
}): BlockAssessment {
  const reasons: string[] = [];
  if (input.recent_severe_or_symptom) {
    reasons.push("检测到高风险症状或严重反应：按安全红线暂停自动引入新食材。");
  }
  return {
    block_new_foods: input.recent_severe_or_symptom,
    reasons,
  };
}

export function recentReactionTriggersHardStop(input: {
  severity: ReactionSeverity;
  reaction_text?: string | null;
  allergenRules: AllergenRules;
}): boolean {
  if (input.severity === "severe") return true;
  if (matchesHighRiskSymptom(input.reaction_text, input.allergenRules)) return true;
  return false;
}
