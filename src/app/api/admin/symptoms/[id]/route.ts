import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { SymptomDefinition } from "@/lib/types/database";

const updateSchema = z.object({
  defaultWeight: z.number().min(0).max(10).optional(),
  activeStatus: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("*").eq("auth_user_id", user.id).single();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const update: Partial<SymptomDefinition> = {};
  if (parsed.data.defaultWeight !== undefined) update.default_weight = parsed.data.defaultWeight;
  if (parsed.data.activeStatus !== undefined) update.active_status = parsed.data.activeStatus;

  const { error } = await supabase.from("symptom_definitions").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: "Could not update the symptom." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
