import type { TrendPoint } from "@/components/charts/TrendLineChart";
import type { VisitRangeData } from "./visitRangeData";

export function buildSymptomSeries(data: VisitRangeData, symptomDefinitionId: string): TrendPoint[] {
  return data.checkins.map((c) => {
    const entry = data.symptomEntries.find(
      (e) => e.daily_checkin_id === c.id && e.symptom_definition_id === symptomDefinitionId
    );
    return { date: c.entry_date, value: entry?.score ?? null };
  });
}

export function buildSignalSeries(data: VisitRangeData): TrendPoint[] {
  return data.signals.map((s) => ({ date: s.signal_date, value: s.composite_score }));
}
