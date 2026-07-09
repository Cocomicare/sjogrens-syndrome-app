import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const redeemSchema = z.object({
  inviteCode: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const parsed = redeemSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }
  const { inviteCode, firstName, lastName, email, phone, password } = parsed.data;

  const admin = createAdminClient();

  const { data: invite, error: inviteError } = await admin
    .from("patient_invites")
    .select("*")
    .eq("invite_code", inviteCode.trim().toUpperCase())
    .is("used_at", null)
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Invalid or already-used invite code." }, { status: 400 });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite code has expired. Ask your clinic for a new one." }, { status: 400 });
  }

  const { data: created, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  });

  if (createUserError || !created.user) {
    const message =
      createUserError?.message.includes("already been registered") || createUserError?.status === 422
        ? "An account with this email already exists. Try logging in instead."
        : "Could not create your account. Please try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .insert({
      auth_user_id: created.user.id,
      clinic_id: invite.clinic_id,
      role: "patient_family",
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
    })
    .select()
    .single();

  if (profileError || !profile) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "Could not finish setting up your account. Please try again." }, { status: 500 });
  }

  await admin.from("patients").update({ patient_family_profile_id: profile.id }).eq("id", invite.patient_id);
  await admin.from("patient_invites").update({ used_at: new Date().toISOString() }).eq("id", invite.id);
  await admin.from("audit_logs").insert({
    actor_profile_id: profile.id,
    clinic_id: invite.clinic_id,
    patient_id: invite.patient_id,
    action: "invite_redeemed",
    resource_type: "patient_invites",
    resource_id: invite.id,
  });

  return NextResponse.json({ ok: true });
}
