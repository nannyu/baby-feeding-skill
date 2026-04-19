export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function mondayOfWeekUtc(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  const dow = d.getUTCDay();
  const delta = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + delta);
  return isoDateFromUtc(d);
}

function isoDateFromUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysUtc(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDateFromUtc(d);
}

export function ageInMonths(dobIso: string, asOfIso: string): number {
  const dob = new Date(`${dobIso}T12:00:00.000Z`);
  const asOf = new Date(`${asOfIso}T12:00:00.000Z`);
  let months = (asOf.getUTCFullYear() - dob.getUTCFullYear()) * 12;
  months += asOf.getUTCMonth() - dob.getUTCMonth();
  if (asOf.getUTCDate() < dob.getUTCDate()) months -= 1;
  return Math.max(0, months);
}
