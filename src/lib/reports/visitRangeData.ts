import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Appointment,
  DailyCheckin,
  Database,
  FamilyObservationEntry,
  Medication,
  MedicationEntry,
  Patient,
  SymptomBaseline,
  SymptomDefinition,
  SymptomEntry,
  SymptomSignal,
} from "@/lib/types/database";
import type { ResolvedRange } from "./dateRange";

export interface VisitRangeData {
  patient: Patient;
  range: ResolvedRange;
  checkins: DailyCheckin[];
  symptomEntries: SymptomEntry[];
  familyObservations: FamilyObservationEntry[];
  signals: SymptomSignal[];
  symptomDefinitions: SymptomDefinition[];
  appointments: Appointment[];
  baselines: SymptomBaseline[];
  medications: Medication[];
  medicationEntries: MedicationEntry[];
}

export async function fetchVisitRangeData(
  supabase: SupabaseClient<Database>,
  patientId: string,
  range: ResolvedRange
): Promise<VisitRangeData | null> {
  const { data: patient } = await supabase.from("patients").select("*").eq("id", patientId).single();
  if (!patient) return null;

  const [
    { data: checkins },
    { data: signals },
    { data: symptomDefinitions },
    { data: appointments },
    { data: baselines },
    { data: medications },
  ] = await Promise.all([
    supabase
      .from("daily_checkins")
      .select("*")
      .eq("patient_id", patientId)
      .gte("entry_date", range.start)
      .lte("entry_date", range.end)
      .order("entry_date"),
    supabase
      .from("symptom_signals")
      .select("*")
      .eq("patient_id", patientId)
      .gte("signal_date", range.start)
      .lte("signal_date", range.end)
      .order("signal_date"),
    supabase.from("symptom_definitions").select("*").order("sort_order"),
    supabase.from("appointments").select("*").eq("patient_id", patientId).order("appointment_date"),
    supabase.from("symptom_baselines").select("*").eq("patient_id", patientId),
    supabase.from("medications").select("*").eq("patient_id", patientId),
  ]);

  const checkinIds = (checkins ?? []).map((c) => c.id);

  const medicationIds = (medications ?? []).map((m) => m.id);

  const [{ data: symptomEntries }, { data: familyObservations }, { data: medicationEntries }] = await Promise.all([
    checkinIds.length
      ? supabase.from("symptom_entries").select("*").in("daily_checkin_id", checkinIds)
      : Promise.resolve({ data: [] as SymptomEntry[] }),
    checkinIds.length
      ? supabase.from("family_observation_entries").select("*").in("daily_checkin_id", checkinIds)
      : Promise.resolve({ data: [] as FamilyObservationEntry[] }),
    medicationIds.length
      ? supabase
          .from("medication_entries")
          .select("*")
          .in("medication_id", medicationIds)
          .gte("entry_date", range.start)
          .lte("entry_date", range.end)
      : Promise.resolve({ data: [] as MedicationEntry[] }),
  ]);

  return {
    patient,
    range,
    checkins: checkins ?? [],
    symptomEntries: symptomEntries ?? [],
    familyObservations: familyObservations ?? [],
    signals: signals ?? [],
    symptomDefinitions: symptomDefinitions ?? [],
    appointments: appointments ?? [],
    baselines: baselines ?? [],
    medications: medications ?? [],
    medicationEntries: medicationEntries ?? [],
  };
}
