import { z } from "zod";

export const AllergyRiskSchema = z.enum(["low", "medium", "high"]);
export type AllergyRisk = z.infer<typeof AllergyRiskSchema>;

export const BabyProfileSchema = z.object({
  baby_id: z.string(),
  nickname: z.string(),
  dob: z.string(),
  weight_kg: z.number().nullable().optional(),
  teething_status: z.string().nullable().optional(),
  allergy_risk: AllergyRiskSchema,
  feeding_method: z.string().nullable().optional(),
  active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type BabyProfile = z.infer<typeof BabyProfileSchema>;
