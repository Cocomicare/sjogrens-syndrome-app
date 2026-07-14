import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { SymptomIcon } from "@/components/checkin/SymptomIcon";
import { PatientDateRangeSelector } from "@/components/patient/PatientDateRangeSelector";
import { resolvePatientDateRange } from "@/lib/reports/patientDateRange";
import { SIGNAL_CATEGORY_BAND, SIGNAL_CATEGORY_LABEL, signalCategoryHex } from "@/lib/types/domain";

export default async function CompositeScoreHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; start?: string; end?: string }>;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const sp = await searchParams;

  const { data: patients } = await supabase
    .from("patients")
    .select("*")
    .eq("patient_family_profile_id", profile.id)
    .eq("active_status", true);

  if (!patients || patients.length === 0) redirect("/patient");
  const patient = patients[0];

  const range = resolvePatientDateRange(sp);

  const [{ data: signals }, { data: checkins }] = await Promise.all([
    supabase
      .from("symptom_signals")
      .select("*")
      .eq("patient_id", patient.id)
      .gte("signal_date", range.start)
      .lte("signal_date", range.end)
      .order("signal_date", { ascending: true }),
    supabase
      .from("daily_checkins")
      .select("*")
      .eq("patient_id", patient.id)
      .not("completed_at", "is", null)
      .gte("entry_date", range.start)
      .lte("entry_date", range.end)
      .order("entry_date", { ascending: false })
      .order("completed_at", { ascending: false }),
  ]);

  // Latest check-in per day, to let each entry link to something editable.
  const checkinIdByDate = new Map<string, string>();
  for (const c of checkins ?? []) {
    if (!checkinIdByDate.has(c.entry_date)) checkinIdByDate.set(c.entry_date, c.id);
  }

  const trendData = (signals ?? []).map((s) => ({
    date: s.signal_date,
    value: s.composite_score,
    color: signalCategoryHex(s.category),
  }));

  const recordedScores = trendData.map((d) => d.value).filter((v): v is number => v !== null);
  const average = recordedScores.length
    ? Math.round((recordedScores.reduce((sum, v) => sum + v, 0) / recordedScores.length) * 100) / 100
    : null;
  const highest = recordedScores.length ? Math.max(...recordedScores) : null;
  const lowest = recordedScores.length ? Math.min(...recordedScores) : null;

  const latestSignal = (signals ?? []).at(-1);
  const latestBand = latestSignal ? SIGNAL_CATEGORY_BAND[latestSignal.category] : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/patient/history" className="text-sm text-zinc-500 hover:text-brand-dark">
          ← Back to history
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <SymptomIcon symptomName="composite_score" band={latestBand ?? "mild"} className="h-12 w-12" />
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Composite Sjögren&apos;s Score</h1>
            {latestSignal && (
              <p className="text-sm text-zinc-500">Most recent: {SIGNAL_CATEGORY_LABEL[latestSignal.category]}</p>
            )}
          </div>
        </div>
      </div>

      <PatientDateRangeSelector currentStart={range.start} currentEnd={range.end} />

      <Card style={{ borderColor: "#a78bfa", borderWidth: "3px" }}>
        <CardHeader>
          <CardTitle>Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {recordedScores.length === 0 ? (
            <p className="text-sm text-zinc-500">No data in this range yet.</p>
          ) : (
            <>
              <TrendLineChart data={trendData} domain={[-5, 5]} height={200} />
              <p className="mt-2 text-xs text-zinc-400">
                Combines all your tracked symptoms relative to your baseline · higher = more active symptoms
              </p>
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

      <Card style={{ borderColor: "#a78bfa", borderWidth: "3px" }}>
        <CardHeader>
          <CardTitle>Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {!signals || signals.length === 0 ? (
            <p className="text-sm text-zinc-500">No entries yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-100">
              {[...signals].reverse().map((s) => {
                const band = SIGNAL_CATEGORY_BAND[s.category];
                const checkinId = checkinIdByDate.get(s.signal_date);
                return (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <SymptomIcon symptomName="composite_score" band={band} compositeVariant="banded" className="h-8 w-8" />
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {format(new Date(s.signal_date + "T00:00:00"), "EEEE, MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {s.composite_score ?? "—"} · {SIGNAL_CATEGORY_LABEL[s.category]}
                        </p>
                      </div>
                    </div>
                    {checkinId && (
                      <Link
                        href={`/patient/checkin?id=${checkinId}`}
                        className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-dark hover:bg-brand-soft"
                      >
                        Edit
                      </Link>
                    )}
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
