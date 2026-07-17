import { redirect } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { CheckinWizard, type CheckinInitialData } from "@/components/checkin/CheckinWizard";
import { SEVERITY_BAND_SCORE } from "@/lib/types/domain";

export default async function CheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
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

  const [{ data: definitions }, { data: settings }] = await Promise.all([
    supabase.from("symptom_definitions").select("*").eq("active_status", true).order("sort_order"),
    supabase.from("patient_symptom_settings").select("*").eq("patient_id", patient.id),
  ]);

  const disabledIds = new Set((settings ?? []).filter((s) => !s.enabled).map((s) => s.symptom_definition_id));
  const catalog = (definitions ?? []).filter((d) => !disabledIds.has(d.id));

  let existingCheckin = null;
  if (sp.id) {
    const { data } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("id", sp.id)
      .eq("patient_id", patient.id)
      .maybeSingle();
    existingCheckin = data;
  }

  const entryDate = existingCheckin ? existingCheckin.entry_date : format(new Date(), "yyyy-MM-dd");
  const entryTime = existingCheckin?.completed_at ? format(new Date(existingCheckin.completed_at), "HH:mm") : format(new Date(), "HH:mm");

  let initial: CheckinInitialData | undefined;
  if (existingCheckin) {
    const [{ data: symptomEntries }, { data: familyObservation }] = await Promise.all([
      supabase.from("symptom_entries").select("*").eq("daily_checkin_id", existingCheckin.id),
      supabase.from("family_observation_entries").select("notes").eq("daily_checkin_id", existingCheckin.id).maybeSingle(),
    ]);

    const coreIds = new Set(catalog.filter((d) => d.is_core).map((d) => d.id));
    const optionalIds = new Set(catalog.filter((d) => d.is_optional && !d.is_safety_flag).map((d) => d.id));
    const safetyIds = new Set(catalog.filter((d) => d.is_safety_flag).map((d) => d.id));

    initial = {
      coreScores: Object.fromEntries(
        (symptomEntries ?? [])
          .filter((e) => coreIds.has(e.symptom_definition_id))
          .map((e) => [e.symptom_definition_id, e.score ?? SEVERITY_BAND_SCORE.mild])
      ),
      optionalScores: Object.fromEntries(
        (symptomEntries ?? [])
          .filter((e) => optionalIds.has(e.symptom_definition_id))
          .map((e) => [e.symptom_definition_id, e.score ?? SEVERITY_BAND_SCORE.mild])
      ),
      safetyPresent: Object.fromEntries(
        (symptomEntries ?? []).filter((e) => safetyIds.has(e.symptom_definition_id)).map((e) => [e.symptom_definition_id, true])
      ),
      familyNote: familyObservation?.notes ?? undefined,
    };
  }

  return (
    <CheckinWizard
      patientId={patient.id}
      patientFirstName={patient.first_name}
      entryDate={entryDate}
      entryTime={entryTime}
      checkinId={existingCheckin?.id}
      isEditing={Boolean(existingCheckin)}
      initial={initial}
      coreSymptoms={catalog.filter((d) => d.is_core)}
      optionalSymptoms={catalog.filter((d) => d.is_optional && !d.is_safety_flag)}
      safetySymptoms={catalog.filter((d) => d.is_safety_flag)}
    />
  );
}
