import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recalculateAllSignalsForPatient } from "@/lib/signal/backfill";

const updateSchema = z.object({
  weights: z.record(z.string().uuid(), z.number().min(0).max(100)),
});

/** Saves the full set of core-symptom weights for a patient in one call — they must sum to exactly 100%. */
export async function PATCH(request: Request, { params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const { weights } = parsed.data;

  const total = Math.round(Object.values(weights).reduce((sum, w) => sum + w, 0) * 100) / 100;
  if (total !== 100) {
    return NextResponse.json({ error: `Weights must sum to 100% (currently ${total}%).` }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("*").eq("auth_user_id", user.id).single();
  if (!profile || !["doctor", "clinic_admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { data: patient } = await supabase.from("patients").select("clinic_id").eq("id", patientId).single();
  if (!patient || (profile.role !== "super_admin" && patient.clinic_id !== profile.clinic_id)) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  for (const [symptomDefinitionId, weight] of Object.entries(weights)) {
    const { error } = await supabase.from("patient_symptom_settings").upsert(
      {
        patient_id: patientId,
        symptom_definition_id: symptomDefinitionId,
        custom_weight: weight,
      },
      { onConflict: "patient_id,symptom_definition_id" }
    );
    if (error) return NextResponse.json({ error: "Could not save weights." }, { status: 500 });
  }

  const admin = createAdminClient();
  const { recalculated } = await recalculateAllSignalsForPatient(admin, patientId);

  return NextResponse.json({ ok: true, recalculated });
}
