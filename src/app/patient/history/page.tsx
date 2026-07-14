import Link from "next/link";
import { redirect } from "next/navigation";
import { format, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { SymptomIcon } from "@/components/checkin/SymptomIcon";
import { feelingOption, severityBand, signalCategoryHex } from "@/lib/types/domain";

const HISTORY_DAYS = 90;

export default async function PatientHistoryPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: patients } = await supabase
    .from("patients")
    .select("*")
    .eq("patient_family_profile_id", profile.id)
    .eq("active_status", true);

  if (!patients || patients.length === 0) redirect("/patient");
  const patient = patients[0];

  const since = format(subDays(new Date(), HISTORY_DAYS - 1), "yyyy-MM-dd");

  const { data: checkins } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("patient_id", patient.id)
    .not("completed_at", "is", null)
    .gte("entry_date", since)
    .order("entry_date", { ascending: false })
    .order("completed_at", { ascending: false });

  const checkinIds = (checkins ?? []).map((c) => c.id);

  const [{ data: symptomEntries }, { data: familyObservations }, { data: symptomDefinitions }] = await Promise.all([
    checkinIds.length
      ? supabase.from("symptom_entries").select("*").in("daily_checkin_id", checkinIds).eq("is_present", true)
      : Promise.resolve({ data: [] }),
    checkinIds.length
      ? supabase.from("family_observation_entries").select("*").in("daily_checkin_id", checkinIds)
      : Promise.resolve({ data: [] }),
    supabase.from("symptom_definitions").select("*"),
  ]);

  const safetyDefinitionIds = new Set((symptomDefinitions ?? []).filter((d) => d.is_safety_flag).map((d) => d.id));
  const flaggedCheckinIds = new Set(
    (symptomEntries ?? []).filter((e) => safetyDefinitionIds.has(e.symptom_definition_id)).map((e) => e.daily_checkin_id)
  );
  const notedCheckinIds = new Set(
    (familyObservations ?? []).filter((f) => f.notes && f.notes.trim().length > 0).map((f) => f.daily_checkin_id)
  );

  const { data: signals } = await supabase
    .from("symptom_signals")
    .select("*")
    .eq("patient_id", patient.id)
    .gte("signal_date", since);

  const signalByDate = new Map((signals ?? []).map((s) => [s.signal_date, s]));
  const trendData = Array.from({ length: HISTORY_DAYS }).map((_, i) => {
    const day = subDays(new Date(), HISTORY_DAYS - 1 - i);
    const dayStr = format(day, "yyyy-MM-dd");
    const signal = signalByDate.get(dayStr);
    return {
      date: dayStr,
      value: signal?.composite_score ?? null,
      color: signal ? signalCategoryHex(signal.category) : undefined,
    };
  });

  // Symptoms worth their own trend page: every core symptom, plus any optional one the patient has actually logged.
  const trackedOptionalIds = new Set((symptomEntries ?? []).map((e) => e.symptom_definition_id));
  const listedSymptoms = (symptomDefinitions ?? [])
    .filter((d) => !d.is_safety_flag && (d.is_core || trackedOptionalIds.has(d.id)))
    .sort((a, b) => a.sort_order - b.sort_order);

  // Most recent score per symptom, using checkins' existing latest-first ordering.
  const checkinOrder = new Map((checkins ?? []).map((c, i) => [c.id, i]));
  const latestBySymptom = new Map<string, number>();
  const latestOrderBySymptom = new Map<string, number>();
  for (const e of symptomEntries ?? []) {
    if (e.score === null) continue;
    const order = checkinOrder.get(e.daily_checkin_id);
    if (order === undefined) continue;
    const bestOrder = latestOrderBySymptom.get(e.symptom_definition_id);
    if (bestOrder === undefined || order < bestOrder) {
      latestOrderBySymptom.set(e.symptom_definition_id, order);
      latestBySymptom.set(e.symptom_definition_id, e.score);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/patient" className="text-sm text-zinc-500 hover:text-brand-dark">
            ← Back to dashboard
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">{patient.first_name}&apos;s history</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Composite Sjögren&apos;s Score</CardTitle>
        </CardHeader>
        <CardContent>
          {!trendData.some((d) => d.value !== null) ? (
            <p className="text-sm text-zinc-500">No check-ins yet.</p>
          ) : (
            <>
              <TrendLineChart data={trendData} domain={[-5, 5]} height={200} />
              <p className="mt-2 text-xs text-zinc-400">
                Last {HISTORY_DAYS} days · combines all your tracked symptoms relative to your baseline · higher = more active symptoms
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By symptom</CardTitle>
        </CardHeader>
        <CardContent>
          {listedSymptoms.length === 0 ? (
            <p className="text-sm text-zinc-500">No symptoms tracked yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {listedSymptoms.map((d) => {
                const latestScore = latestBySymptom.get(d.id);
                const band = latestScore !== undefined ? severityBand(latestScore) : undefined;
                return (
                  <Link
                    key={d.id}
                    href={`/patient/history/${d.id}`}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 p-3 text-center hover:border-brand hover:bg-brand-soft"
                  >
                    <SymptomIcon symptomName={d.name} band={band ?? "mild"} className="h-9 w-9" />
                    <span className="text-xs font-medium text-zinc-700">{d.patient_label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          {!checkins || checkins.length === 0 ? (
            <p className="text-sm text-zinc-500">No check-ins in this range yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-100">
              {checkins.map((c) => {
                const option = feelingOption(c.overall_feeling);
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option?.emoji ?? "—"}</span>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {format(new Date(c.entry_date + "T00:00:00"), "EEEE, MMM d, yyyy")}
                          {c.completed_at && (
                            <span className="ml-1.5 font-normal text-zinc-400">
                              · {format(new Date(c.completed_at), "h:mm a")}
                            </span>
                          )}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-zinc-500">{option?.label ?? "Unknown"}</span>
                          {flaggedCheckinIds.has(c.id) && (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                              Flagged
                            </span>
                          )}
                          {notedCheckinIds.has(c.id) && (
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                              Note
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/patient/checkin?id=${c.id}`}
                      className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-dark hover:bg-brand-soft"
                    >
                      Edit
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
