import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const userSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["doctor", "clinic_admin"]),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const parsed = userSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  const { firstName, lastName, email, phone, role, password } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: actingProfile } = await supabase.from("profiles").select("*").eq("auth_user_id", user.id).single();
  if (!actingProfile || !["clinic_admin", "super_admin"].includes(actingProfile.role) || !actingProfile.clinic_id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: created, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  });

  if (createUserError || !created.user) {
    const message =
      createUserError?.status === 422 ? "An account with this email already exists." : "Could not create the account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { error: profileError } = await admin.from("profiles").insert({
    auth_user_id: created.user.id,
    clinic_id: actingProfile.clinic_id,
    role,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: phone || null,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "Could not finish creating the account." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
