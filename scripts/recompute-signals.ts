/**
 * One-off recompute: re-runs the real signal engine (baselines + composite
 * signals) for every patient's full check-in history. Needed after the
 * 1-5 score rescale migration, since symptom_baselines/symptom_signals are
 * derived from symptom_entries.score and don't update themselves.
 *
 * Usage: npx tsx scripts/recompute-signals.ts   (requires .env.local with Supabase project + service role key)
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/types/database";
import { recalculateAllSignalsForPatient } from "../src/lib/signal/backfill";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local first.");
  process.exit(1);
}

const admin: SupabaseClient<Database> = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: patients, error } = await admin.from("patients").select("id, first_name, last_name");
  if (error) {
    console.error("Failed to fetch patients:", error.message);
    process.exit(1);
  }

  console.log(`Recomputing signals for ${patients?.length ?? 0} patients...`);

  for (const patient of patients ?? []) {
    const { recalculated } = await recalculateAllSignalsForPatient(admin, patient.id);
    console.log(`  ${patient.first_name} ${patient.last_name}: recalculated ${recalculated} days`);
  }

  console.log("Done.");
}

main();
