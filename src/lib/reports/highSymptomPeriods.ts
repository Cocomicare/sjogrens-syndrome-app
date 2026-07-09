import type { SignalCategory } from "@/lib/types/database";

export interface SignalPoint {
  signal_date: string;
  category: SignalCategory;
}

export interface HighSymptomPeriod {
  startDate: string;
  endDate: string;
  category: SignalCategory;
  dayCount: number;
}

const ELEVATED_RANK: Partial<Record<SignalCategory, number>> = {
  mildly_elevated: 1,
  moderately_elevated: 2,
  significantly_elevated: 3,
  safety_flag: 4,
};

/** Groups consecutive elevated-signal days into activity periods, keeping the worst category seen in each run. */
export function groupHighSymptomPeriods(signals: SignalPoint[]): HighSymptomPeriod[] {
  const elevated = signals
    .filter((s) => s.category in ELEVATED_RANK)
    .sort((a, b) => (a.signal_date < b.signal_date ? -1 : 1));

  const periods: HighSymptomPeriod[] = [];
  let current: HighSymptomPeriod | null = null;
  let previousDate: string | null = null;

  for (const point of elevated) {
    const isConsecutive = previousDate !== null && daysBetween(previousDate, point.signal_date) === 1;

    if (current && isConsecutive) {
      current.endDate = point.signal_date;
      current.dayCount += 1;
      if ((ELEVATED_RANK[point.category] ?? 0) > (ELEVATED_RANK[current.category] ?? 0)) {
        current.category = point.category;
      }
    } else {
      if (current) periods.push(current);
      current = { startDate: point.signal_date, endDate: point.signal_date, category: point.category, dayCount: 1 };
    }
    previousDate = point.signal_date;
  }
  if (current) periods.push(current);

  return periods.reverse();
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}
