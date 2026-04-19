export function pickMealTypes(mealsPerDay: number): Array<"breakfast" | "lunch" | "dinner"> {
  if (mealsPerDay <= 2) return ["lunch", "dinner"];
  return ["breakfast", "lunch", "dinner"];
}

export function scoreTemplateRotationIndex(dayIndex: number, templateIndex: number, templatesLen: number): number {
  return (dayIndex + templateIndex) % templatesLen;
}
