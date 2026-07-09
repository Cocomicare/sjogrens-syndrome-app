import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const appointmentSchema = z.object({
  patientId: z.string().uuid(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentType: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  const parsed = appointmentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid appointment data." }, { status: 400 });
  }
  const { patientId, appointmentDate, appointmentType, notes } = parsed.data;

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

  const { error } = await supabase.from("appointments").insert({
    patient_id: patientId,
    clinic_id: patient.clinic_id,
    doctor_id: profile.role === "doctor" ? profile.id : null,
    appointment_date: appointmentDate,
    appointment_type: appointmentType || null,
    notes: notes || null,
  });

  if (error) {
    return NextResponse.json({ error: "Could not save the appointment." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
