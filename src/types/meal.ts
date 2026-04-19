import { z } from "zod";

export const MealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);
export type MealType = z.infer<typeof MealTypeSchema>;

export const MealSlotSchema = z.object({
  meal_type: MealTypeSchema,
  recipe_name: z.string(),
  ingredients: z.array(z.string()),
  texture: z.string(),
  is_new_food: z.boolean(),
  watch_points: z.array(z.string()),
  instructions: z.string(),
});

export type MealSlot = z.infer<typeof MealSlotSchema>;

export const DayPlanSchema = z.object({
  date: z.string(),
  meals: z.array(MealSlotSchema),
});

export type DayPlan = z.infer<typeof DayPlanSchema>;
