import type Database from "better-sqlite3";
import type { FoodStatusValue } from "../../types/food.js";

export type FoodStatusRow = {
  baby_id: string;
  food_id: string;
  status: FoodStatusValue;
  last_try_at: string | null;
  updated_at: string;
};

function rowToFoodStatus(row: Record<string, unknown>): FoodStatusRow {
  return {
    baby_id: String(row.baby_id),
    food_id: String(row.food_id),
    status: row.status as FoodStatusValue,
    last_try_at: row.last_try_at === null || row.last_try_at === undefined ? null : String(row.last_try_at),
    updated_at: String(row.updated_at),
  };
}

export function listFoodStatus(db: Database.Database, babyId: string): FoodStatusRow[] {
  const rows = db.prepare(`SELECT * FROM food_status WHERE baby_id = ?`).all(babyId) as Record<string, unknown>[];
  return rows.map(rowToFoodStatus);
}

export function getFoodStatus(db: Database.Database, babyId: string, foodId: string): FoodStatusRow | null {
  const row = db.prepare(`SELECT * FROM food_status WHERE baby_id = ? AND food_id = ?`).get(babyId, foodId) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToFoodStatus(row) : null;
}

export function upsertFoodStatus(
  db: Database.Database,
  input: { baby_id: string; food_id: string; status: FoodStatusValue; last_try_at?: string | null },
): FoodStatusRow {
  const now = new Date().toISOString();
  db.prepare(
    `
    INSERT INTO food_status (baby_id, food_id, status, last_try_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(baby_id, food_id) DO UPDATE SET
      status = excluded.status,
      last_try_at = COALESCE(excluded.last_try_at, food_status.last_try_at),
      updated_at = excluded.updated_at
  `,
  ).run(input.baby_id, input.food_id, input.status, input.last_try_at ?? null, now);
  return getFoodStatus(db, input.baby_id, input.food_id)!;
}
