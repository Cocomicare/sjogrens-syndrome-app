import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { format, subDays } from "date-fns";
import type { Database } from "@/lib/types/database";

export type RangePreset = "since_last_appointment" | "30" | "60" | "90" | "custom";

export interface ResolvedRange {
  start: string;
  end: string;
  preset: RangePreset;
  label: string;
}

export async function resolveDateRange(
  supabase: SupabaseClient<Database>,
  patientId: string,
  params: { preset?: string; start?: string; end?: string }
): Promise<ResolvedRange> {
  const today = format(new Date(), "yyyy-MM-dd");
  const preset = (params.preset as RangePreset) || "since_last_appointment";

  if (preset === "custom" && params.start && params.end) {
    return { start: params.start, end: params.end, preset, label: "Custom range" };
  }

  if (preset === "30" || preset === "60" || preset === "90") {
    const days = Number(preset);
    return { start: format(subDays(new Date(), days), "yyyy-MM-dd"), end: today, preset, label: `Last ${days} days` };
  }

  const { data: appointments } = await supabase
    .from("appointments")
    .select("appointment_date")
    .eq("patient_id", patientId)
    .lte("appointment_date", today)
    .order("appointment_date", { ascending: false })
    .limit(1);

  const lastAppointment = appointments?.[0]?.appointment_date;
  if (lastAppointment) {
    return { start: lastAppointment, end: today, preset: "since_last_appointment", label: "Since last appointment" };
  }

  return { start: format(subDays(new Date(), 90), "yyyy-MM-dd"), end: today, preset: "since_last_appointment", label: "Since last appointment (last 90 days — no prior visit on file)" };
}
