import type { TrendPoint } from "@/components/charts/TrendLineChart";
import { SEVERITY_BAND_HEX, SEVERITY_BAND_ORDER, severityBand } from "@/lib/types/domain";
import type { VisitRangeData } from "./visitRangeData";

/** 1 (Severe) - 5 (None) patient-facing band scale, matching the patient-side symptom history charts. */
function bandScaleValue(score: number): number {
  return SEVERITY_BAND_ORDER.indexOf(severityBand(score)) + 1;
}

export function buildSymptomSeries(data: VisitRangeData, symptomDefinitionId: string): TrendPoint[] {
  return data.checkins.map((c) => {
    const entry = data.symptomEntries.find(
      (e) => e.daily_checkin_id === c.id && e.symptom_definition_id === symptomDefinitionId
    );
    if (entry?.score == null) return { date: c.entry_date, value: null };
    const band = severityBand(entry.score);
    return { date: c.entry_date, value: bandScaleValue(entry.score), color: SEVERITY_BAND_HEX[band] };
  });
}

export function buildSignalSeries(data: VisitRangeData): TrendPoint[] {
  return data.signals.map((s) => ({ date: s.signal_date, value: s.composite_score }));
}
