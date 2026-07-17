import { differenceInCalendarDays } from "date-fns";
import type { TrendPoint } from "@/components/charts/TrendLineChart";
import { groupHighSymptomPeriods, type HighSymptomPeriod } from "./highSymptomPeriods";
import type { VisitRangeData } from "./visitRangeData";

export interface SymptomStat {
  symptomKey: string;
  label: string;
  average: number | null;
  highest: number | null;
  lowest: number | null;
  baseline: number | null;
  deltaFromBaseline: number | null;
}

export interface SafetyFlagEvent {
  date: string;
  flags: string[];
}

export interface MedicationAdherenceStat {
  medicationName: string;
  takenCount: number;
  totalEntries: number;
  percent: number | null;
}

export interface ReportSummary {
  patientName: string;
  rangeStart: string;
  rangeEnd: string;
  rangeLabel: string;
  daysInRange: number;
  completedCheckins: number;
  completionPercent: number;
  symptomStats: SymptomStat[];
  mostIncreased: SymptomStat[];
  mostImproved: SymptomStat[];
  highSymptomPeriods: HighSymptomPeriod[];
  safetyFlagEvents: SafetyFlagEvent[];
  medicationAdherence: MedicationAdherenceStat[];
  signalTrend: TrendPoint[];
  notesTimeline: { date: string; source: string; text: string }[];
}

export function buildReportSummary(data: VisitRangeData): ReportSummary {
  const daysInRange = differenceInCalendarDays(new Date(data.range.end), new Date(data.range.start)) + 1;
  const completedCheckins = data.checkins.filter((c) => c.completed_at).length;
  const completionPercent = daysInRange > 0 ? round1((completedCheckins / daysInRange) * 100) : 0;

  const baselineByDefinitionId = new Map(data.baselines.map((b) => [b.symptom_definition_id, b]));
  const trackedDefinitions = data.symptomDefinitions.filter((d) => d.is_core);

  const symptomStats: SymptomStat[] = trackedDefinitions
    .map((def): SymptomStat | null => {
      const scores = data.symptomEntries
        .filter((e) => e.symptom_definition_id === def.id && e.score !== null)
        .map((e) => e.score as number);
      if (scores.length === 0) return null;

      const average = round2(scores.reduce((s, v) => s + v, 0) / scores.length);
      const baseline = baselineByDefinitionId.get(def.id)?.baseline_score ?? null;

      return {
        symptomKey: def.name,
        label: def.patient_label,
        average,
        highest: Math.max(...scores),
        lowest: Math.min(...scores),
        baseline,
        deltaFromBaseline: baseline !== null ? round2(average - baseline) : null,
      };
    })
    .filter((s): s is SymptomStat => s !== null);

  const withDelta = symptomStats.filter((s) => s.deltaFromBaseline !== null);
  const mostIncreased = [...withDelta].sort((a, b) => (b.deltaFromBaseline ?? 0) - (a.deltaFromBaseline ?? 0)).slice(0, 3);
  const mostImproved = [...withDelta].sort((a, b) => (a.deltaFromBaseline ?? 0) - (b.deltaFromBaseline ?? 0)).slice(0, 3);

  const highSymptomPeriods = groupHighSymptomPeriods(
    data.signals.map((s) => ({ signal_date: s.signal_date, category: s.category }))
  );

  const safetyFlagEvents: SafetyFlagEvent[] = data.signals
    .filter((s) => s.safety_flags.length > 0)
    .map((s) => ({ date: s.signal_date, flags: s.safety_flags }));

  const medicationAdherence: MedicationAdherenceStat[] = data.medications.map((med) => {
    const entries = data.medicationEntries.filter((e) => e.medication_id === med.id);
    const takenCount = entries.filter((e) => e.taken).length;
    return {
      medicationName: med.medication_name,
      takenCount,
      totalEntries: entries.length,
      percent: entries.length > 0 ? round1((takenCount / entries.length) * 100) : null,
    };
  });

  const signalTrend: TrendPoint[] = data.signals.map((s) => ({ date: s.signal_date, value: s.composite_score }));

  const checkinById = new Map(data.checkins.map((c) => [c.id, c]));
  const notesTimeline = [
    ...data.familyObservations
      .filter((fo) => fo.notes)
      .map((fo) => ({
        date: checkinById.get(fo.daily_checkin_id)?.entry_date ?? "",
        source: "Family observation",
        text: fo.notes as string,
      })),
    ...data.checkins
      .filter((c) => c.notes)
      .map((c) => ({ date: c.entry_date, source: "Check-in note", text: c.notes as string })),
    ...data.appointments
      .filter((a) => a.notes && a.appointment_date >= data.range.start && a.appointment_date <= data.range.end)
      .map((a) => ({ date: a.appointment_date, source: "Appointment", text: a.notes as string })),
  ].sort((a, b) => (a.date < b.date ? -1 : 1));

  return {
    patientName: `${data.patient.first_name} ${data.patient.last_name}`,
    rangeStart: data.range.start,
    rangeEnd: data.range.end,
    rangeLabel: data.range.label,
    daysInRange,
    completedCheckins,
    completionPercent,
    symptomStats,
    mostIncreased,
    mostImproved,
    highSymptomPeriods,
    safetyFlagEvents,
    medicationAdherence,
    signalTrend,
    notesTimeline,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
