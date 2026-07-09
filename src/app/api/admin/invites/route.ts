import { NextResponse } from "next/server";
import { z } from "zod";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { generateInviteCode } from "@/lib/utils/inviteCode";

const inviteSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sex: z.string().optional(),
  primaryDoctorId: z.string().uuid().optional().or(z.literal("")),
  expiresInDays: z.number().int().min(1).max(90).default(14),
});

export async function POST(request: Request) {
  const parsed = inviteSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  const { firstName, lastName, dateOfBirth, sex, primaryDoctorId, expiresInDays } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("*").eq("auth_user_id", user.id).single();
  if (!profile || !["clinic_admin", "doctor", "super_admin"].includes(profile.role) || !profile.clinic_id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .insert({
      clinic_id: profile.clinic_id,
      primary_doctor_id: primaryDoctorId || null,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      sex: sex || null,
    })
    .select()
    .single();

  if (patientError || !patient) {
    return NextResponse.json({ error: "Could not create the patient record." }, { status: 500 });
  }

  const { data: invite, error: inviteError } = await supabase
    .from("patient_invites")
    .insert({
      clinic_id: profile.clinic_id,
      patient_id: patient.id,
      invite_code: generateInviteCode(),
      expires_at: addDays(new Date(), expiresInDays).toISOString(),
      created_by_profile_id: profile.id,
    })
    .select()
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Could not create the invite code." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inviteCode: invite.invite_code, patientId: patient.id });
}
