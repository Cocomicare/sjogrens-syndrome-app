import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveDateRange } from "@/lib/reports/dateRange";
import { fetchVisitRangeData } from "@/lib/reports/visitRangeData";
import { buildReportSummary } from "@/lib/reports/buildReportSummary";
import type { ReportType } from "@/lib/types/database";

const reportSchema = z.object({
  patientId: z.string().uuid(),
  preset: z.string(),
  start: z.string().optional(),
  end: z.string().optional(),
});

const REPORT_TYPE_BY_PRESET: Record<string, ReportType> = {
  since_last_appointment: "since_last_appointment",
  "30": "last_30_days",
  "60": "last_60_days",
  "90": "last_90_days",
  custom: "custom_range",
};

export async function POST(request: Request) {
  const parsed = reportSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid report request." }, { status: 400 });
  const { patientId, preset, start, end } = parsed.data;

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

  const range = await resolveDateRange(supabase, patientId, { preset, start, end });
  const data = await fetchVisitRangeData(supabase, patientId, range);
  if (!data) return NextResponse.json({ error: "Patient not found." }, { status: 404 });

  const summary = buildReportSummary(data);

  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      patient_id: patientId,
      generated_by_profile_id: profile.id,
      date_range_start: range.start,
      date_range_end: range.end,
      report_type: REPORT_TYPE_BY_PRESET[preset] ?? "custom_range",
      report_data: summary as unknown as Record<string, unknown>,
    })
    .select()
    .single();

  if (error || !report) {
    return NextResponse.json({ error: "Could not save the report." }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    actor_profile_id: profile.id,
    clinic_id: profile.clinic_id,
    patient_id: patientId,
    action: "report_generated",
    resource_type: "reports",
    resource_id: report.id,
  });

  return NextResponse.json({ ok: true, reportId: report.id });
}
