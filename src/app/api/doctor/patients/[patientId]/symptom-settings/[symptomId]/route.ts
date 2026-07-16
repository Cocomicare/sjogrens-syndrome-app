import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recalculateAllSignalsForPatient } from "@/lib/signal/backfill";

const updateSchema = z.object({
  // null resets to the catalog default (clears the per-patient override).
  weight: z.number().min(0).max(100).nullable().optional(),
  calculationMethod: z.enum(["average", "stddev"]).nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ patientId: string; symptomId: string }> }
) {
  const { patientId, symptomId } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const { weight, calculationMethod } = parsed.data;

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

  const update: { custom_weight?: number | null; calculation_method?: "average" | "stddev" | null } = {};
  if (weight !== undefined) update.custom_weight = weight;
  if (calculationMethod !== undefined) update.calculation_method = calculationMethod;

  const { error } = await supabase.from("patient_symptom_settings").upsert(
    {
      patient_id: patientId,
      symptom_definition_id: symptomId,
      ...update,
    },
    { onConflict: "patient_id,symptom_definition_id" }
  );
  if (error) return NextResponse.json({ error: "Could not save the setting." }, { status: 500 });

  const admin = createAdminClient();
  const { recalculated } = await recalculateAllSignalsForPatient(admin, patientId);

  return NextResponse.json({ ok: true, recalculated });
}
