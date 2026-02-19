export type PlanChecks = Record<number, boolean>;

function keyForYear(year: number) {
  return `bible.readingPlanChecks.${year}`;
}

export function loadPlanChecks(year: number): PlanChecks {
  const raw = localStorage.getItem(keyForYear(year));
  if (!raw) return {};
  try {
    return JSON.parse(raw) as PlanChecks;
  } catch {
    return {};
  }
}

export function savePlanChecks(year: number, checks: PlanChecks) {
  localStorage.setItem(keyForYear(year), JSON.stringify(checks));
}

export function togglePlanDay(checks: PlanChecks, day: number): PlanChecks {
  return {
    ...checks,
    [day]: !checks[day],
  };
}

export function calcPlanCompletionPercent(checks: PlanChecks, totalDays = 365) {
  const completed = Object.values(checks).filter(Boolean).length;
  if (totalDays <= 0) return 0;
  return Math.min(100, Math.round((completed / totalDays) * 100));
}
