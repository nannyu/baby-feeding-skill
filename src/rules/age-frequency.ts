import type { FeedingStage } from "../config/load-data.js";

export function pickMealsPerDay(stages: FeedingStage[], ageMonths: number): { meals_per_day: number; stage_note?: string } {
  const sorted = [...stages].sort((a, b) => a.min_age_months - b.min_age_months);
  for (let i = sorted.length - 1; i >= 0; i--) {
    const s = sorted[i]!;
    if (ageMonths < s.min_age_months) continue;
    const max = s.max_age_months_exclusive;
    if (max === null || ageMonths < max) {
      return { meals_per_day: s.meals_per_day, stage_note: s.notes_zh };
    }
  }
  const fallback = sorted[0]!;
  return { meals_per_day: fallback.meals_per_day, stage_note: fallback.notes_zh };
}
