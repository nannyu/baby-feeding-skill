import type Database from "better-sqlite3";
import type { ReactionSeverity } from "../../types/food.js";

export type FoodTrialRow = {
  trial_id: string;
  baby_id: string;
  food_id: string;
  tried_at: string;
  first_time_flag: boolean;
  reaction: string | null;
  severity: ReactionSeverity;
  liked_score: number | null;
  stool_note: string | null;
  gi_note: string | null;
  note: string | null;
};

export function insertFoodTrial(
  db: Database.Database,
  input: {
    trial_id: string;
    baby_id: string;
    food_id: string;
    tried_at: string;
    first_time_flag: boolean;
    reaction?: string | null;
    severity: ReactionSeverity;
    liked_score?: number | null;
    stool_note?: string | null;
    gi_note?: string | null;
    note?: string | null;
  },
): void {
  db.prepare(
    `
    INSERT INTO food_trial (
      trial_id, baby_id, food_id, tried_at, first_time_flag, reaction, severity, liked_score, stool_note, gi_note, note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    input.trial_id,
    input.baby_id,
    input.food_id,
    input.tried_at,
    input.first_time_flag ? 1 : 0,
    input.reaction ?? null,
    input.severity,
    input.liked_score ?? null,
    input.stool_note ?? null,
    input.gi_note ?? null,
    input.note ?? null,
  );
}

export function listRecentTrials(db: Database.Database, babyId: string, limit: number): FoodTrialRow[] {
  const rows = db
    .prepare(`SELECT * FROM food_trial WHERE baby_id = ? ORDER BY tried_at DESC LIMIT ?`)
    .all(babyId, limit) as Record<string, unknown>[];
  return rows.map((row) => ({
    trial_id: String(row.trial_id),
    baby_id: String(row.baby_id),
    food_id: String(row.food_id),
    tried_at: String(row.tried_at),
    first_time_flag: Boolean(row.first_time_flag),
    reaction: row.reaction === null || row.reaction === undefined ? null : String(row.reaction),
    severity: row.severity as ReactionSeverity,
    liked_score: row.liked_score === null || row.liked_score === undefined ? null : Number(row.liked_score),
    stool_note: row.stool_note === null || row.stool_note === undefined ? null : String(row.stool_note),
    gi_note: row.gi_note === null || row.gi_note === undefined ? null : String(row.gi_note),
    note: row.note === null || row.note === undefined ? null : String(row.note),
  }));
}
