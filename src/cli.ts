#!/usr/bin/env node
import process from "node:process";
import { createRuntime } from "./runtime.js";
import { createOrUpdateBabyProfile } from "./tools/profile.js";
import { generateWeeklyMealPlan, loadWeekPlanFromDb } from "./tools/meal-plan.js";
import { logFoodReaction } from "./tools/reaction-log.js";
import { exportCalendarIcs } from "./tools/export-ics.js";

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const { db, data } = createRuntime();

  try {
    if (cmd === "profile") {
      const nickname = argv[1] ?? "朵朵";
      const dob = argv[2] ?? "2025-09-19";
      const res = createOrUpdateBabyProfile(db, {
        nickname,
        dob,
        allergy_risk: "medium",
        weight_kg: 8.1,
        teething_status: "2颗牙",
        feeding_method: "mixed",
        make_active: true,
      });
      printJson(res);
      return;
    }

    if (cmd === "plan") {
      const weekStart = argv[1];
      const res = generateWeeklyMealPlan(db, data, { week_start: weekStart ?? null });
      printJson(res);
      return;
    }

    if (cmd === "reaction") {
      const foodId = argv[1] ?? "avocado";
      const severity = (argv[2] as "none" | "mild" | "moderate" | "severe") ?? "mild";
      const reaction = argv[3] ?? "嘴周轻微发红";
      const res = logFoodReaction(db, data, {
        food_id: foodId,
        severity,
        reaction,
        liked_score: 4,
      });
      printJson(res);
      return;
    }

    if (cmd === "ics") {
      const planId = argv[1];
      if (!planId) {
        process.stderr.write("usage: baby-feeding ics <plan_id>\n");
        process.exitCode = 2;
        return;
      }
      const res = exportCalendarIcs(db, { plan_id: planId });
      process.stdout.write(res.ics);
      if (res.warnings.length) process.stderr.write(`${res.warnings.join("\n")}\n`);
      return;
    }

    if (cmd === "show-plan") {
      const planId = argv[1];
      if (!planId) {
        process.stderr.write("usage: baby-feeding show-plan <plan_id>\n");
        process.exitCode = 2;
        return;
      }
      printJson(loadWeekPlanFromDb(db, planId));
      return;
    }

    process.stderr.write(
      [
        "usage:",
        "  baby-feeding profile [nickname] [dob]",
        "  baby-feeding plan [week_start_yyyy-mm-dd]",
        "  baby-feeding reaction [food_id] [severity] [reaction_text]",
        "  baby-feeding ics <plan_id>",
        "  baby-feeding show-plan <plan_id>",
        "",
      ].join("\n"),
    );
    process.exitCode = 2;
  } finally {
    db.close();
  }
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
  process.exitCode = 1;
});
