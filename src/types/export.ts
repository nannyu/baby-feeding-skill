import { z } from "zod";
import { DayPlanSchema } from "./meal.js";
import { AllergyRiskSchema } from "./baby.js";

export const ActiveBabySummarySchema = z.object({
  baby_id: z.string(),
  nickname: z.string(),
  age_months: z.number(),
  weight_kg: z.number().nullable().optional(),
  risk_level: AllergyRiskSchema,
});

export type ActiveBabySummary = z.infer<typeof ActiveBabySummarySchema>;

export const ToolResponseSchema = z.object({
  active_baby: ActiveBabySummarySchema.nullable(),
  week_plan: z.array(DayPlanSchema),
  shopping_list: z.array(z.string()),
  calendar_events: z.array(z.record(z.string(), z.unknown())),
  risk_flags: z.array(z.string()),
  rule_audit_summary: z.array(
    z.object({
      rule_group: z.string(),
      rule_key: z.string(),
      decision: z.enum(["allow", "block", "adjust"]),
      reason: z.string(),
    }),
  ),
});

export type ToolResponse = z.infer<typeof ToolResponseSchema>;
