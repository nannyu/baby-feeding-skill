import { describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "../../src/storage/database.js";
import { loadDataBundle } from "../../src/config/load-data.js";
import { createOrUpdateBabyProfile } from "../../src/tools/profile.js";
import { generateWeeklyMealPlan } from "../../src/tools/meal-plan.js";
import { logFoodReaction } from "../../src/tools/reaction-log.js";
import { exportCalendarIcs } from "../../src/tools/export-ics.js";

describe("M1 flow", () => {
  it("profile → plan → ics, and severe reaction blocks new foods in subsequent plan", () => {
    const db = new Database(":memory:");
    runMigrations(db);
    const data = loadDataBundle(import.meta.url);

    const p = createOrUpdateBabyProfile(db, {
      nickname: "朵朵",
      dob: "2025-09-19",
      allergy_risk: "medium",
      weight_kg: 8.1,
      make_active: true,
    });
    expect(p.profile?.baby_id).toBeTruthy();

    const plan1 = generateWeeklyMealPlan(db, data, { week_start: "2026-04-20" });
    expect(plan1.plan_id).toBeTruthy();
    expect(plan1.week_plan.length).toBe(7);

    const ics1 = exportCalendarIcs(db, { plan_id: plan1.plan_id });
    expect(ics1.ics).toContain("BEGIN:VCALENDAR");
    expect(ics1.ics).toContain("END:VCALENDAR");

    logFoodReaction(db, data, {
      food_id: "egg_yolk",
      severity: "severe",
      reaction: "呕吐多次",
      liked_score: 1,
    });

    const plan2 = generateWeeklyMealPlan(db, data, { week_start: "2026-04-27" });
    expect(plan2.risk_flags.length).toBeGreaterThan(0);
    expect(plan2.rule_audit_summary.some((a) => a.rule_group === "blocker")).toBe(true);

    db.close();
  });
});
