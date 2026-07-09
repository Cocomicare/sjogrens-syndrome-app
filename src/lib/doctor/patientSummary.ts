import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { subDays, format, differenceInYears } from "date-fns";
import type { Database, SignalCategory } from "@/lib/types/database";

export interface PatientSummary {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  lastCheckinDate: string | null;
  recentSignalCategory: SignalCategory | null;
  recentSignalScore: number | null;
  highSymptomDays: number;
  missedEntries: number;
  hasSafetyFlag: boolean;
  lastAppointmentDate: string | null;
  nextAppointmentDate: string | null;
}

const ELEVATED: SignalCategory[] = ["moderately_elevated", "significantly_elevated", "safety_flag"];
const WINDOW_DAYS = 30;

export async function getPatientSummaries(
  supabase: SupabaseClient<Database>,
  clinicId: string
): Promise<PatientSummary[]> {
  const { data: patients } = await supabase
    .from("patients")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("active_status", true)
    .order("first_name");

  if (!patients || patients.length === 0) return [];

  const since = format(subDays(new Date(), WINDOW_DAYS), "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");
  const patientIds = patients.map((p) => p.id);

  const [{ data: signals }, { data: checkins }, { data: appointments }] = await Promise.all([
    supabase
      .from("symptom_signals")
      .select("*")
      .in("patient_id", patientIds)
      .gte("signal_date", since)
      .order("signal_date", { ascending: false }),
    supabase
      .from("daily_checkins")
      .select("patient_id, entry_date, completed_at")
      .in("patient_id", patientIds)
      .gte("entry_date", since)
      .not("completed_at", "is", null),
    supabase.from("appointments").select("*").in("patient_id", patientIds).order("appointment_date"),
  ]);

  return patients.map((patient) => {
    const patientSignals = (signals ?? []).filter((s) => s.patient_id === patient.id);
    const latestSignal = patientSignals[0] ?? null;
    const highSymptomDays = patientSignals.filter((s) => ELEVATED.includes(s.category)).length;
    const hasSafetyFlag = patientSignals.some((s) => s.category === "safety_flag");

    const patientCheckins = (checkins ?? []).filter((c) => c.patient_id === patient.id);
    const lastCheckin = patientCheckins.sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1))[0];
    const missedEntries = WINDOW_DAYS - patientCheckins.length;

    const patientAppointments = (appointments ?? []).filter((a) => a.patient_id === patient.id);
    const past = patientAppointments.filter((a) => a.appointment_date <= today).slice(-1)[0];
    const upcoming = patientAppointments.find((a) => a.appointment_date > today);

    return {
      id: patient.id,
      firstName: patient.first_name,
      lastName: patient.last_name,
      age: differenceInYears(new Date(), new Date(patient.date_of_birth)),
      lastCheckinDate: lastCheckin?.entry_date ?? null,
      recentSignalCategory: latestSignal?.category ?? null,
      recentSignalScore: latestSignal?.composite_score ?? null,
      highSymptomDays,
      missedEntries: Math.max(missedEntries, 0),
      hasSafetyFlag,
      lastAppointmentDate: past?.appointment_date ?? null,
      nextAppointmentDate: upcoming?.appointment_date ?? null,
    };
  });
}
