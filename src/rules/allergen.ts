import type { AllergenRules } from "../config/load-data.js";

export function matchesHighRiskSymptom(reactionText: string | null | undefined, rules: AllergenRules): boolean {
  if (!reactionText) return false;
  const t = reactionText.toLowerCase();
  for (const s of rules.high_risk_symptoms_zh) {
    if (reactionText.includes(s)) return true;
  }
  for (const s of rules.high_risk_symptoms_en ?? []) {
    if (t.includes(s.toLowerCase())) return true;
  }
  return false;
}
