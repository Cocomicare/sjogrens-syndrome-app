import type { TrendPoint } from "@/components/charts/TrendLineChart";
import { SEVERITY_BAND_HEX, severityBand } from "@/lib/types/domain";
import type { VisitRangeData } from "./visitRangeData";

export function buildSymptomSeries(data: VisitRangeData, symptomDefinitionId: string): TrendPoint[] {
  return data.checkins.map((c) => {
    const entry = data.symptomEntries.find(
      (e) => e.daily_checkin_id === c.id && e.symptom_definition_id === symptomDefinitionId
    );
    if (entry?.score == null) return { date: c.entry_date, value: null };
    return { date: c.entry_date, value: entry.score, color: SEVERITY_BAND_HEX[severityBand(entry.score)] };
  });
}

export function buildSignalSeries(data: VisitRangeData): TrendPoint[] {
  return data.signals.map((s) => ({ date: s.signal_date, value: s.composite_score }));
}
