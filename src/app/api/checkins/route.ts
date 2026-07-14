import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recalculateSignalForPatientDate } from "@/lib/signal/service";

const checkinSchema = z.object({
  checkinId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  overallFeeling: z.number().int().min(0).max(4),
  coreScores: z.record(z.string().uuid(), z.number().int().min(0).max(10)),
  optionalScores: z.record(z.string().uuid(), z.number().int().min(0).max(10)),
  safetyPresent: z.record(z.string().uuid(), z.boolean()),
  familyObservations: z.record(z.string(), z.boolean()),
  familyNote: z.string().max(2000).optional(),
});

const FAMILY_OBSERVATION_KEYS = [
  "missed_school",
  "reduced_activity",
  "poor_sleep",
  "appetite_change",
  "visible_discomfort",
  "medication_missed",
  "other_concern",
] as const;

export async function POST(request: Request) {
  const parsed = checkinSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid check-in data." }, { status: 400 });
  }
  const {
    checkinId,
    patientId,
    entryDate,
    overallFeeling,
    coreScores,
    optionalScores,
    safetyPresent,
    familyObservations,
    familyNote,
  } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("*").eq("auth_user_id", user.id).single();
  if (!profile || profile.role !== "patient_family") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .eq("patient_family_profile_id", profile.id)
    .single();
  if (!patient) {
    return NextResponse.json({ error: "Patient not found for this account." }, { status: 403 });
  }

  let checkin;
  if (checkinId) {
    const { data: existing } = await supabase
      .from("daily_checkins")
      .select("id")
      .eq("id", checkinId)
      .eq("patient_id", patientId)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Check-in not found for this account." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("daily_checkins")
      .update({
        entry_date: entryDate,
        overall_feeling: overallFeeling,
        completed_at: new Date().toISOString(),
      })
      .eq("id", checkinId)
      .select()
      .single();
    checkin = data;
    if (error || !checkin) {
      return NextResponse.json({ error: "Could not save your check-in. Please try again." }, { status: 500 });
    }
  } else {
    const { data, error } = await supabase
      .from("daily_checkins")
      .insert({
        patient_id: patientId,
        entry_date: entryDate,
        overall_feeling: overallFeeling,
        entered_by_profile_id: profile.id,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();
    checkin = data;
    if (error || !checkin) {
      return NextResponse.json({ error: "Could not save your check-in. Please try again." }, { status: 500 });
    }
  }

  await supabase.from("symptom_entries").delete().eq("daily_checkin_id", checkin.id);

  const entries = [
    ...Object.entries(coreScores).map(([symptom_definition_id, score]) => ({
      daily_checkin_id: checkin.id,
      patient_id: patientId,
      symptom_definition_id,
      score,
      is_present: true,
    })),
    ...Object.entries(optionalScores).map(([symptom_definition_id, score]) => ({
      daily_checkin_id: checkin.id,
      patient_id: patientId,
      symptom_definition_id,
      score,
      is_present: true,
    })),
    ...Object.entries(safetyPresent)
      .filter(([, present]) => present)
      .map(([symptom_definition_id]) => ({
        daily_checkin_id: checkin.id,
        patient_id: patientId,
        symptom_definition_id,
        score: null,
        is_present: true,
      })),
  ];

  if (entries.length > 0) {
    await supabase.from("symptom_entries").insert(entries);
  }

  const familyRow = Object.fromEntries(FAMILY_OBSERVATION_KEYS.map((k) => [k, !!familyObservations[k]]));
  await supabase.from("family_observation_entries").upsert(
    {
      daily_checkin_id: checkin.id,
      patient_id: patientId,
      ...familyRow,
      notes: familyNote || null,
    },
    { onConflict: "daily_checkin_id" }
  );

  const admin = createAdminClient();
  await recalculateSignalForPatientDate(admin, patientId, checkin.id, entryDate);

  await supabase.from("audit_logs").insert({
    actor_profile_id: profile.id,
    clinic_id: profile.clinic_id,
    patient_id: patientId,
    action: "checkin_submitted",
    resource_type: "daily_checkins",
    resource_id: checkin.id,
  });

  return NextResponse.json({ ok: true });
}
