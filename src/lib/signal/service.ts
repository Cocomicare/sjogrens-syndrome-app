import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { calculateBaseline, DEFAULT_BASELINE_WINDOW_DAYS } from "./baseline";
import { resolveWeight } from "./weights";
import { computeSymptomSignal } from "./compositeScore";
import type { SymptomBaselineInput, SymptomObservation } from "./types";

/**
 * Recalculates the patient's per-symptom baselines and that day's composite
 * Sjögren's Symptom Signal, then persists both. Called after a check-in is
 * submitted (or edited) for `checkinDate`.
 *
 * Requires a Supabase client with write access to symptom_baselines and
 * symptom_signals (these are system-calculated tables — RLS only grants
 * write access to the service role, so callers should pass an admin client).
 */
export async function recalculateSignalForPatientDate(
  supabase: SupabaseClient<Database>,
  patientId: string,
  checkinDate: string
): Promise<void> {
  const [{ data: definitions }, { data: settings }, { data: checkin }] = await Promise.all([
    supabase.from("symptom_definitions").select("*").eq("active_status", true),
    supabase.from("patient_symptom_settings").select("*").eq("patient_id", patientId),
    supabase
      .from("daily_checkins")
      .select("id")
      .eq("patient_id", patientId)
      .eq("entry_date", checkinDate)
      .single(),
  ]);

  if (!definitions || !checkin) return;

  const settingsByDefinitionId = new Map((settings ?? []).map((s) => [s.symptom_definition_id, s]));

  const { data: todaysEntries } = await supabase
    .from("symptom_entries")
    .select("*")
    .eq("daily_checkin_id", checkin.id);

  const entriesByDefinitionId = new Map((todaysEntries ?? []).map((e) => [e.symptom_definition_id, e]));

  const observations: SymptomObservation[] = [];
  const baselineInputs: SymptomBaselineInput[] = [];
  const windowStart = new Date(checkinDate);
  windowStart.setDate(windowStart.getDate() - DEFAULT_BASELINE_WINDOW_DAYS);
  const windowStartStr = windowStart.toISOString().slice(0, 10);

  const { data: windowCheckins } = await supabase
    .from("daily_checkins")
    .select("id")
    .eq("patient_id", patientId)
    .gte("entry_date", windowStartStr)
    .lt("entry_date", checkinDate);

  const windowCheckinIds = (windowCheckins ?? []).map((c) => c.id);

  const { data: windowEntries } = windowCheckinIds.length
    ? await supabase.from("symptom_entries").select("symptom_definition_id, score").in("daily_checkin_id", windowCheckinIds)
    : { data: [] as { symptom_definition_id: string; score: number | null }[] };

  for (const def of definitions) {
    const setting = settingsByDefinitionId.get(def.id);
    if (setting && setting.enabled === false) continue;

    const entry = entriesByDefinitionId.get(def.id);

    if (def.is_safety_flag) {
      if (entry) {
        observations.push({
          symptomKey: def.name,
          score: entry.score,
          isPresent: entry.is_present,
          isSafetyFlagSymptom: true,
        });
      }
      continue;
    }

    if (entry) {
      observations.push({
        symptomKey: def.name,
        score: entry.score,
        isSafetyFlagSymptom: false,
      });
    }

    // Historical scores strictly before this check-in, within the baseline window.
    const scores = (windowEntries ?? [])
      .filter((e) => e.symptom_definition_id === def.id)
      .map((e) => e.score)
      .filter((s): s is number => typeof s === "number");

    const baseline = calculateBaseline(scores);
    if (!baseline) continue;

    await supabase.from("symptom_baselines").upsert(
      {
        patient_id: patientId,
        symptom_definition_id: def.id,
        baseline_score: baseline.baselineScore,
        standard_deviation: baseline.standardDeviation,
        sample_size: baseline.sampleSize,
        calculation_window_days: DEFAULT_BASELINE_WINDOW_DAYS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "patient_id,symptom_definition_id" }
    );

    baselineInputs.push({
      symptomKey: def.name,
      baselineScore: baseline.baselineScore,
      weight: resolveWeight(Number(def.default_weight), setting?.custom_weight ?? null),
    });
  }

  const result = computeSymptomSignal({ observations, baselines: baselineInputs });

  await supabase.from("symptom_signals").upsert(
    {
      patient_id: patientId,
      signal_date: checkinDate,
      composite_score: result.compositeScore,
      category: result.category,
      included_symptoms: result.includedSymptoms,
      excluded_symptoms: result.excludedSymptoms,
      safety_flags: result.safetyFlags,
      calculated_at: new Date().toISOString(),
    },
    { onConflict: "patient_id,signal_date" }
  );
}
