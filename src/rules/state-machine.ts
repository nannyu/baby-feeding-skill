import type { FoodStatusValue, ReactionSeverity } from "../types/food.js";
import { recentReactionTriggersHardStop } from "./blocker.js";
import type { AllergenRules } from "../config/load-data.js";

export function defaultStatusForUntried(): FoodStatusValue {
  return "UNTRIED";
}

export function nextFoodStatus(input: {
  previous: FoodStatusValue | null;
  severity: ReactionSeverity;
  liked_score?: number | null;
  reaction_text?: string | null;
  first_time_flag: boolean;
  allergenRules: AllergenRules;
}): FoodStatusValue {
  if (recentReactionTriggersHardStop(input)) return "SUSPECTED_ALLERGY_BLOCK";
  if (input.severity === "moderate") return "SUSPECTED_INTOLERANCE";

  if (input.severity === "mild") {
    return input.first_time_flag ? "OBSERVING" : "TOLERATED";
  }

  if (input.severity === "none") {
    const liked = input.liked_score ?? 3;
    if (liked <= 2) return "DISLIKED";
    return "TOLERATED";
  }

  return input.previous ?? defaultStatusForUntried();
}

export function shouldBlockNewFoodsInPlanner(statuses: Map<string, FoodStatusValue>): boolean {
  for (const st of statuses.values()) {
    if (st === "OBSERVING") return true;
  }
  return false;
}
