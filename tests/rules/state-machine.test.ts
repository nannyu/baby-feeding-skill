import { describe, expect, it } from "vitest";
import { nextFoodStatus, shouldBlockNewFoodsInPlanner } from "../../src/rules/state-machine.js";

const rules = {
  high_risk_symptoms_zh: ["呼吸困难"],
  high_risk_symptoms_en: [],
  observation_days_after_new_high_allergen: 3,
};

describe("state-machine", () => {
  it("flags observing as planner hard stop for new foods", () => {
    const m = new Map<string, import("../../src/types/food.js").FoodStatusValue>();
    m.set("egg_yolk", "OBSERVING");
    expect(shouldBlockNewFoodsInPlanner(m)).toBe(true);
  });

  it("does not globally block only allergy-blocked single food", () => {
    const m = new Map<string, import("../../src/types/food.js").FoodStatusValue>();
    m.set("egg_yolk", "SUSPECTED_ALLERGY_BLOCK");
    expect(shouldBlockNewFoodsInPlanner(m)).toBe(false);
  });

  it("high risk symptom text forces allergy block", () => {
    expect(
      nextFoodStatus({
        previous: "UNTRIED",
        severity: "mild",
        liked_score: 5,
        reaction_text: "有点呼吸困难",
        first_time_flag: true,
        allergenRules: rules,
      }),
    ).toBe("SUSPECTED_ALLERGY_BLOCK");
  });

  it("severe forces allergy block", () => {
    expect(
      nextFoodStatus({
        previous: "UNTRIED",
        severity: "severe",
        reaction_text: null,
        first_time_flag: true,
        allergenRules: rules,
      }),
    ).toBe("SUSPECTED_ALLERGY_BLOCK");
  });
});
