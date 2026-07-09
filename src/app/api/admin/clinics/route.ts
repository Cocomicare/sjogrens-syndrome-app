import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const clinicSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = clinicSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Please enter a clinic name." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("*").eq("auth_user_id", user.id).single();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { error } = await supabase.from("clinics").insert(parsed.data);
  if (error) return NextResponse.json({ error: "Could not create the clinic." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
