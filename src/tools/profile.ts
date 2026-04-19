import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { AllergyRisk } from "../types/baby.js";
import { upsertBabyProfile, getActiveBaby } from "../storage/repositories/baby-profile.js";
import type { BabyProfile } from "../types/baby.js";
import { ageInMonths, isoDate } from "../dates.js";
import type { ActiveBabySummary } from "../types/export.js";

export function createOrUpdateBabyProfile(
  db: Database.Database,
  input: {
    baby_id?: string | null;
    nickname: string;
    dob: string;
    weight_kg?: number | null;
    teething_status?: string | null;
    allergy_risk: AllergyRisk;
    feeding_method?: string | null;
    make_active?: boolean;
  },
): { profile: BabyProfile; active_baby: ActiveBabySummary | null } {
  const baby_id = input.baby_id?.trim() || `baby_${randomUUID()}`;
  const make_active = input.make_active ?? true;

  const profile = upsertBabyProfile(db, {
    baby_id,
    nickname: input.nickname,
    dob: input.dob,
    weight_kg: input.weight_kg,
    teething_status: input.teething_status,
    allergy_risk: input.allergy_risk,
    feeding_method: input.feeding_method,
    make_active,
  });

  const active = getActiveBaby(db);
  const active_baby: ActiveBabySummary | null = active
    ? {
        baby_id: active.baby_id,
        nickname: active.nickname,
        age_months: ageInMonths(active.dob, isoDate(new Date())),
        weight_kg: active.weight_kg ?? undefined,
        risk_level: active.allergy_risk,
      }
    : null;

  return { profile, active_baby };
}
