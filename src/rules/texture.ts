import type { TextureRule } from "../config/load-data.js";

export function allowedTexturesForAge(rules: TextureRule[], ageMonths: number): Set<string> {
  const sorted = [...rules].sort((a, b) => a.min_age_months - b.min_age_months);
  for (let i = sorted.length - 1; i >= 0; i--) {
    const r = sorted[i]!;
    if (ageMonths < r.min_age_months) continue;
    const max = r.max_age_months_exclusive;
    if (max === null || ageMonths < max) {
      return new Set(r.allowed_textures);
    }
  }
  return new Set(sorted[0]!.allowed_textures);
}
