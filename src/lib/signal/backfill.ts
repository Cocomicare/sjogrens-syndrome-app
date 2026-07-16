import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { recalculateSignalForPatientDate } from "./service";

/**
 * Recalculates a patient's full symptom_signals history — used when a
 * doctor changes a symptom's weight or calculation method, since that
 * changes the composite score math for every past day, not just future ones.
 *
 * Requires an admin client (see recalculateSignalForPatientDate).
 */
export async function recalculateAllSignalsForPatient(
  supabase: SupabaseClient<Database>,
  patientId: string
): Promise<{ recalculated: number }> {
  const { data: checkins } = await supabase
    .from("daily_checkins")
    .select("id, entry_date, completed_at")
    .eq("patient_id", patientId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: true });

  // One signal per day: when multiple check-ins share a date, the latest completed one wins.
  const latestCheckinByDate = new Map<string, string>();
  for (const c of checkins ?? []) {
    latestCheckinByDate.set(c.entry_date, c.id);
  }

  let recalculated = 0;
  for (const [entryDate, checkinId] of latestCheckinByDate) {
    await recalculateSignalForPatientDate(supabase, patientId, checkinId, entryDate);
    recalculated++;
  }

  return { recalculated };
}
