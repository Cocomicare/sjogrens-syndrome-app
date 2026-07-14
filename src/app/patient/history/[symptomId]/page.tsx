import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { SymptomIcon } from "@/components/checkin/SymptomIcon";
import { severityBand, symptomBandLabel } from "@/lib/types/domain";

const HISTORY_DAYS = 90;

export default async function SymptomHistoryPage({ params }: { params: Promise<{ symptomId: string }> }) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { symptomId } = await params;

  const { data: patients } = await supabase
    .from("patients")
    .select("*")
    .eq("patient_family_profile_id", profile.id)
    .eq("active_status", true);

  if (!patients || patients.length === 0) redirect("/patient");
  const patient = patients[0];

  const { data: symptom } = await supabase.from("symptom_definitions").select("*").eq("id", symptomId).maybeSingle();
  if (!symptom || symptom.is_safety_flag) notFound();

  const since = format(subDays(new Date(), HISTORY_DAYS - 1), "yyyy-MM-dd");

  const { data: checkins } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("patient_id", patient.id)
    .not("completed_at", "is", null)
    .gte("entry_date", since)
    .order("entry_date", { ascending: false })
    .order("completed_at", { ascending: false });

  // Latest check-in per day represents that day for this trend, same convention as the main history chart.
  const latestCheckinPerDay = new Map<string, { id: string; entry_date: string }>();
  for (const c of checkins ?? []) {
    if (!latestCheckinPerDay.has(c.entry_date)) latestCheckinPerDay.set(c.entry_date, c);
  }
  const relevantCheckinIds = [...latestCheckinPerDay.values()].map((c) => c.id);

  const { data: symptomEntries } = relevantCheckinIds.length
    ? await supabase.from("symptom_entries").select("*").eq("symptom_definition_id", symptomId).in("daily_checkin_id", relevantCheckinIds)
    : { data: [] };

  const scoreByCheckinId = new Map((symptomEntries ?? []).map((e) => [e.daily_checkin_id, e.score]));

  const trendData = [...latestCheckinPerDay.entries()]
    .map(([date, c]) => ({ date, value: scoreByCheckinId.get(c.id) ?? null }))
    .reverse();

  const recordedScores = trendData.map((d) => d.value).filter((v): v is number => v !== null);
  const average = recordedScores.length
    ? Math.round((recordedScores.reduce((sum, v) => sum + v, 0) / recordedScores.length) * 10) / 10
    : null;
  const highest = recordedScores.length ? Math.max(...recordedScores) : null;
  const lowest = recordedScores.length ? Math.min(...recordedScores) : null;

  const latestEntry = trendData.filter((d) => d.value !== null).at(-1) ?? null;
  const latestBand = latestEntry ? severityBand(latestEntry.value as number) : undefined;

  // Full list of individual entries, most recent first, for the detail list below the chart.
  const entryRows = (checkins ?? [])
    .filter((c) => scoreByCheckinId.has(c.id))
    .map((c) => ({ checkin: c, score: scoreByCheckinId.get(c.id) as number }));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/patient/history" className="text-sm text-zinc-500 hover:text-brand-dark">
          ← Back to history
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <SymptomIcon symptomName={symptom.name} band={latestBand ?? "mild"} className="h-12 w-12" />
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">{symptom.patient_label}</h1>
            {latestBand && (
              <p className="text-sm text-zinc-500">
                Most recent: {symptomBandLabel(symptom.name, latestBand)}
              </p>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last {HISTORY_DAYS} days</CardTitle>
        </CardHeader>
        <CardContent>
          {recordedScores.length === 0 ? (
            <p className="text-sm text-zinc-500">No {symptom.patient_label.toLowerCase()} entries in this range yet.</p>
          ) : (
            <>
              <TrendLineChart data={trendData} domain={[0, 10]} height={200} />
              <p className="mt-2 text-xs text-zinc-400">0 = None · 10 = Severe</p>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-4">
                <div>
                  <p className="text-xs text-zinc-500">Average</p>
                  <p className="text-lg font-semibold text-zinc-900">{average}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Lowest</p>
                  <p className="text-lg font-semibold text-zinc-900">{lowest}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Highest</p>
                  <p className="text-lg font-semibold text-zinc-900">{highest}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {entryRows.length === 0 ? (
            <p className="text-sm text-zinc-500">No entries yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-100">
              {entryRows.map(({ checkin, score }) => {
                const band = severityBand(score);
                return (
                  <li key={checkin.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <SymptomIcon symptomName={symptom.name} band={band} className="h-8 w-8" />
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {format(new Date(checkin.entry_date + "T00:00:00"), "EEEE, MMM d, yyyy")}
                          {checkin.completed_at && (
                            <span className="ml-1.5 font-normal text-zinc-400">
                              · {format(new Date(checkin.completed_at), "h:mm a")}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {score} · {symptomBandLabel(symptom.name, band)}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/patient/checkin?id=${checkin.id}`}
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
