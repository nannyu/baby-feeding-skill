import type Database from "better-sqlite3";
import type { MealSlot, MealType } from "../../types/meal.js";

export type MealPlanRow = {
  plan_id: string;
  baby_id: string;
  week_start: string;
  source_version: string;
  created_at: string;
};

export type MealItemRow = {
  id: number;
  plan_id: string;
  date: string;
  meal_type: MealType;
  recipe_name: string;
  ingredients: string[];
  texture: string;
  is_new_food: boolean;
  watch_points: string[];
  instructions: string;
};

export function insertMealPlanWithItems(
  db: Database.Database,
  input: {
    plan_id: string;
    baby_id: string;
    week_start: string;
    source_version: string;
    items: Array<{
      date: string;
      meal_type: MealType;
      slot: MealSlot;
    }>;
  },
): void {
  const createdAt = new Date().toISOString();
  const tx = db.transaction(() => {
    db.prepare(
      `
      INSERT INTO meal_plan (plan_id, baby_id, week_start, source_version, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    ).run(input.plan_id, input.baby_id, input.week_start, input.source_version, createdAt);

    const insertItem = db.prepare(
      `
      INSERT INTO meal_item (
        plan_id, date, meal_type, recipe_name, ingredients, texture, is_new_food, watch_points, instructions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    );

    for (const item of input.items) {
      insertItem.run(
        input.plan_id,
        item.date,
        item.meal_type,
        item.slot.recipe_name,
        JSON.stringify(item.slot.ingredients),
        item.slot.texture,
        item.slot.is_new_food ? 1 : 0,
        JSON.stringify(item.slot.watch_points),
        item.slot.instructions,
      );
    }
  });
  tx();
}

export function listMealItems(db: Database.Database, planId: string): MealItemRow[] {
  const rows = db
    .prepare(`SELECT * FROM meal_item WHERE plan_id = ? ORDER BY date ASC, id ASC`)
    .all(planId) as Record<string, unknown>[];
  return rows.map((row) => ({
    id: Number(row.id),
    plan_id: String(row.plan_id),
    date: String(row.date),
    meal_type: row.meal_type as MealType,
    recipe_name: String(row.recipe_name),
    ingredients: JSON.parse(String(row.ingredients)) as string[],
    texture: String(row.texture),
    is_new_food: Boolean(row.is_new_food),
    watch_points: JSON.parse(String(row.watch_points)) as string[],
    instructions: String(row.instructions),
  }));
}

export function getMealPlan(db: Database.Database, planId: string): MealPlanRow | null {
  const row = db.prepare(`SELECT * FROM meal_plan WHERE plan_id = ?`).get(planId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    plan_id: String(row.plan_id),
    baby_id: String(row.baby_id),
    week_start: String(row.week_start),
    source_version: String(row.source_version),
    created_at: String(row.created_at),
  };
}
