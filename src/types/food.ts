import { z } from "zod";

export const FoodStatusValueSchema = z.enum([
  "UNTRIED",
  "PLANNED",
  "OBSERVING",
  "TOLERATED",
  "DISLIKED",
  "SUSPECTED_INTOLERANCE",
  "SUSPECTED_ALLERGY_BLOCK",
  "MANUAL_BLOCK",
]);

export type FoodStatusValue = z.infer<typeof FoodStatusValueSchema>;

export const ReactionSeveritySchema = z.enum(["none", "mild", "moderate", "severe"]);
export type ReactionSeverity = z.infer<typeof ReactionSeveritySchema>;
