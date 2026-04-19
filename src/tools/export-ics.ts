import type Database from "better-sqlite3";
import { getMealPlan } from "../storage/repositories/meal-plan.js";
import { loadWeekPlanFromDb } from "./meal-plan.js";

function escapeIcsText(s: string): string {
  return s.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");
}

function foldLine(line: string): string[] {
  const max = 73;
  if (line.length <= max) return [line];
  const out: string[] = [];
  let rest = line;
  while (rest.length > max) {
    out.push(rest.slice(0, max));
    rest = ` ${rest.slice(max)}`;
  }
  if (rest.length) out.push(rest);
  return out;
}

function utcStamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function mealClockUtc(meal_type: string): { h: number; m: number } {
  if (meal_type === "breakfast") return { h: 8, m: 30 };
  if (meal_type === "lunch") return { h: 11, m: 30 };
  if (meal_type === "dinner") return { h: 17, m: 30 };
  return { h: 15, m: 0 };
}

function dtStartUtc(dateIso: string, meal_type: string): string {
  const { h, m } = mealClockUtc(meal_type);
  const d = new Date(`${dateIso}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`);
  return utcStamp(d);
}

export function exportCalendarIcs(
  db: Database.Database,
  input: { plan_id: string; timezone?: string | null; include_observation?: boolean | null },
): { ics: string; warnings: string[] } {
  void input.timezone;
  void input.include_observation;

  const plan = getMealPlan(db, input.plan_id);
  const warnings: string[] = [];
  if (!plan) {
    warnings.push("plan_id 不存在：无法导出 ICS。");
    return { ics: "", warnings };
  }

  const days = loadWeekPlanFromDb(db, input.plan_id);
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//babyfeeding//EN");
  lines.push("CALSCALE:GREGORIAN");

  const now = new Date();
  for (const day of days) {
    for (const meal of day.meals) {
      const uid = `${plan.plan_id}:${day.date}:${meal.meal_type}:${meal.recipe_name}`.replaceAll(" ", "_");
      const summary = `${meal.recipe_name}（${meal.meal_type}）`;
      const descParts = [
        `食材：${meal.ingredients.join("、")}`,
        `质地：${meal.texture}`,
        meal.is_new_food ? "含新食材：白天观察" : "",
        meal.watch_points.length ? `观察点：${meal.watch_points.join("；")}` : "",
        `做法：${meal.instructions}`,
      ].filter(Boolean);

      lines.push("BEGIN:VEVENT");
      for (const l of foldLine(`UID:${uid}`)) lines.push(l);
      for (const l of foldLine(`DTSTAMP:${utcStamp(now)}`)) lines.push(l);
      for (const l of foldLine(`DTSTART:${dtStartUtc(day.date, meal.meal_type)}`)) lines.push(l);
      for (const l of foldLine(`SUMMARY:${escapeIcsText(summary)}`)) lines.push(l);
      for (const l of foldLine(`DESCRIPTION:${escapeIcsText(descParts.join("\\n"))}`)) lines.push(l);
      lines.push("END:VEVENT");
    }
  }

  lines.push("END:VCALENDAR");
  return { ics: `${lines.join("\r\n")}\r\n`, warnings };
}
