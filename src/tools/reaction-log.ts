import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { DataBundle } from "../config/load-data.js";
import { isoDate, ageInMonths } from "../dates.js";
import { getBabyProfile, getActiveBaby } from "../storage/repositories/baby-profile.js";
import { insertFoodTrial } from "../storage/repositories/food-trial.js";
import { getFoodStatus, upsertFoodStatus } from "../storage/repositories/food-status.js";
import type { ReactionSeverity } from "../types/food.js";
import type { ActiveBabySummary, ToolResponse } from "../types/export.js";
import { nextFoodStatus } from "../rules/state-machine.js";
import { recentReactionTriggersHardStop } from "../rules/blocker.js";

export function logFoodReaction(
  db: Database.Database,
  data: DataBundle,
  input: {
    baby_id?: string | null;
    food_id: string;
    tried_at?: string | null;
    reaction?: string | null;
    severity: ReactionSeverity;
    liked_score?: number | null;
    stool_note?: string | null;
    gi_note?: string | null;
    note?: string | null;
  },
): ToolResponse & { updated_status: string; hard_stop: boolean } {
  const profile = (input.baby_id ? getBabyProfile(db, input.baby_id) : null) ?? getActiveBaby(db);
  if (!profile) {
    return {
      active_baby: null,
      week_plan: [],
      shopping_list: [],
      calendar_events: [],
      risk_flags: ["未找到宝宝档案：请先建档或显式传入 baby_id。"],
      rule_audit_summary: [],
      updated_status: "",
      hard_stop: false,
    };
  }

  const tried_at = (input.tried_at ?? isoDate(new Date())).slice(0, 10);
  const previous = getFoodStatus(db, profile.baby_id, input.food_id)?.status ?? null;
  const first_time_flag = previous === null || previous === "UNTRIED";

  const hard_stop = recentReactionTriggersHardStop({
    severity: input.severity,
    reaction_text: input.reaction,
    allergenRules: data.allergenRules,
  });

  const updated_status = nextFoodStatus({
    previous,
    severity: input.severity,
    liked_score: input.liked_score,
    reaction_text: input.reaction,
    first_time_flag,
    allergenRules: data.allergenRules,
  });

  const trial_id = `trial_${randomUUID()}`;
  insertFoodTrial(db, {
    trial_id,
    baby_id: profile.baby_id,
    food_id: input.food_id,
    tried_at,
    first_time_flag,
    reaction: input.reaction,
    severity: input.severity,
    liked_score: input.liked_score,
    stool_note: input.stool_note,
    gi_note: input.gi_note,
    note: input.note,
  });

  upsertFoodStatus(db, {
    baby_id: profile.baby_id,
    food_id: input.food_id,
    status: updated_status,
    last_try_at: tried_at,
  });

  const risk_flags: string[] = [];
  if (hard_stop) {
    risk_flags.push(
      "记录到高风险表现或严重反应：请停止继续尝试相关食材，尽快就医/咨询医生；本输出不构成诊断。",
    );
  }

  const active_baby: ActiveBabySummary = {
    baby_id: profile.baby_id,
    nickname: profile.nickname,
    age_months: ageInMonths(profile.dob, isoDate(new Date())),
    weight_kg: profile.weight_kg ?? undefined,
    risk_level: profile.allergy_risk,
  };

  return {
    active_baby,
    week_plan: [],
    shopping_list: [],
    calendar_events: [],
    risk_flags,
    rule_audit_summary: [
      {
        rule_group: "state_machine",
        rule_key: "food_status_update",
        decision: hard_stop ? "block" : "adjust",
        reason: `食材 ${input.food_id} 状态从 ${previous ?? "UNTRIED(无记录)"} 更新为 ${updated_status}（trial=${trial_id}）。`,
      },
    ],
    updated_status,
    hard_stop,
  };
}
