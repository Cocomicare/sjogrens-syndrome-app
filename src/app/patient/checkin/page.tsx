import { redirect } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { CheckinWizard, type CheckinInitialData } from "@/components/checkin/CheckinWizard";

export default async function CheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const sp = await searchParams;

  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("patient_family_profile_id", profile.id)
    .eq("active_status", true)
    .limit(1)
    .single();

  if (!patient) redirect("/patient");

  const today = format(new Date(), "yyyy-MM-dd");
  const requestedDate = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today;
  const entryDate = requestedDate > today ? today : requestedDate;

  const [{ data: definitions }, { data: settings }] = await Promise.all([
    supabase.from("symptom_definitions").select("*").eq("active_status", true).order("sort_order"),
    supabase.from("patient_symptom_settings").select("*").eq("patient_id", patient.id),
  ]);

  const disabledIds = new Set((settings ?? []).filter((s) => !s.enabled).map((s) => s.symptom_definition_id));
  const catalog = (definitions ?? []).filter((d) => !disabledIds.has(d.id));

  const { data: existingCheckin } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("patient_id", patient.id)
    .eq("entry_date", entryDate)
    .maybeSingle();

  let initial: CheckinInitialData | undefined;
  if (existingCheckin) {
    const { data: symptomEntries } = await supabase
      .from("symptom_entries")
      .select("*")
      .eq("daily_checkin_id", existingCheckin.id);

    const coreIds = new Set(catalog.filter((d) => d.is_core).map((d) => d.id));
    const optionalIds = new Set(catalog.filter((d) => d.is_optional && !d.is_safety_flag).map((d) => d.id));
    const safetyIds = new Set(catalog.filter((d) => d.is_safety_flag).map((d) => d.id));

    initial = {
      overallFeeling: existingCheckin.overall_feeling,
      coreScores: Object.fromEntries(
        (symptomEntries ?? []).filter((e) => coreIds.has(e.symptom_definition_id)).map((e) => [e.symptom_definition_id, e.score ?? 0])
      ),
      optionalScores: Object.fromEntries(
        (symptomEntries ?? [])
          .filter((e) => optionalIds.has(e.symptom_definition_id))
          .map((e) => [e.symptom_definition_id, e.score ?? 0])
      ),
      safetyPresent: Object.fromEntries(
        (symptomEntries ?? []).filter((e) => safetyIds.has(e.symptom_definition_id)).map((e) => [e.symptom_definition_id, true])
      ),
    };
  }

  return (
    <CheckinWizard
      patientId={patient.id}
      patientFirstName={patient.first_name}
      entryDate={entryDate}
      isEditing={Boolean(existingCheckin)}
      initial={initial}
      coreSymptoms={catalog.filter((d) => d.is_core)}
      optionalSymptoms={catalog.filter((d) => d.is_optional && !d.is_safety_flag)}
      safetySymptoms={catalog.filter((d) => d.is_safety_flag)}
    />
  );
}
