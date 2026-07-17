import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { resolveDateRange } from "@/lib/reports/dateRange";
import { fetchVisitRangeData } from "@/lib/reports/visitRangeData";
import { buildReportSummary } from "@/lib/reports/buildReportSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SignalBadge } from "@/components/ui/Badge";
import { DateRangeSelector } from "@/components/doctor/DateRangeSelector";
import { ReportActions } from "@/components/doctor/ReportActions";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { APP_SCOPE_DISCLAIMER, SAFETY_DISCLAIMER } from "@/lib/types/domain";

export default async function OfficeVisitReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ preset?: string; start?: string; end?: string }>;
}) {
  const profile = await requireProfile();
  const { patientId } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: patientCheck } = await supabase.from("patients").select("id, clinic_id").eq("id", patientId).single();
  if (!patientCheck || patientCheck.clinic_id !== profile.clinic_id) notFound();

  const range = await resolveDateRange(supabase, patientId, sp);
  const data = await fetchVisitRangeData(supabase, patientId, range);
  if (!data) notFound();

  const report = buildReportSummary(data);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 print:max-w-none">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/doctor/patients/${patientId}`} className="text-sm text-zinc-500 hover:text-brand-dark">
          ← Back to patient
        </Link>
        <ReportActions patientId={patientId} preset={range.preset} start={range.start} end={range.end} />
      </div>

      <div className="print:hidden">
        <DateRangeSelector currentStart={range.start} currentEnd={range.end} />
      </div>

      <header className="border-b border-zinc-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">Office Visit Report</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{report.patientName}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {report.rangeLabel}: {format(new Date(report.rangeStart), "MMM d, yyyy")} –{" "}
          {format(new Date(report.rangeEnd), "MMM d, yyyy")} ({report.daysInRange} days)
        </p>
        <p className="mt-1 text-xs text-zinc-400">Generated {format(new Date(), "MMM d, yyyy 'at' h:mm a")}</p>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Check-ins completed" value={String(report.completedCheckins)} />
        <Stat label="Days in range" value={String(report.daysInRange)} />
        <Stat label="Completion rate" value={`${report.completionPercent}%`} />
        <Stat
          label="Safety flags"
          value={String(report.safetyFlagEvents.length)}
          highlight={report.safetyFlagEvents.length > 0}
        />
      </section>

      {report.safetyFlagEvents.length > 0 && (
        <Card className="break-inside-avoid border-rose-200 bg-rose-50">
          <CardContent className="pt-5 text-sm text-rose-800">
            <p className="font-semibold">⚠ Safety flags</p>
            <ul className="mt-2 list-inside list-disc">
              {report.safetyFlagEvents.map((e, i) => (
                <li key={i}>
                  {format(new Date(e.date), "MMM d, yyyy")}: {e.flags.join(", ")}
                </li>
              ))}
            </ul>
            <p className="mt-2">{SAFETY_DISCLAIMER}</p>
          </CardContent>
        </Card>
      )}

      <Card className="break-inside-avoid">
        <CardHeader>
          <CardTitle>Sjögren&apos;s Symptom Signal trend</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendLineChart data={report.signalTrend} color="#7c3aed" domain={[-5, 5]} />
        </CardContent>
      </Card>

      <Card className="break-inside-avoid">
        <CardHeader>
          <CardTitle>Symptom summary</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-zinc-400">
              <tr>
                <th className="py-1.5 pr-3">Symptom</th>
                <th className="py-1.5 pr-3">Average</th>
                <th className="py-1.5 pr-3">Highest</th>
                <th className="py-1.5 pr-3">Lowest</th>
                <th className="py-1.5 pr-3">Baseline</th>
                <th className="py-1.5">Change from baseline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {report.symptomStats.map((s) => (
                <tr key={s.symptomKey}>
                  <td className="py-2 pr-3 font-medium text-zinc-800">{s.label}</td>
                  <td className="py-2 pr-3 text-zinc-600">{s.average}</td>
                  <td className="py-2 pr-3 text-zinc-600">{s.highest}</td>
                  <td className="py-2 pr-3 text-zinc-600">{s.lowest}</td>
                  <td className="py-2 pr-3 text-zinc-600">{s.baseline ?? "—"}</td>
                  <td className={"py-2 " + (s.deltaFromBaseline && s.deltaFromBaseline > 0 ? "text-rose-600" : s.deltaFromBaseline && s.deltaFromBaseline < 0 ? "text-emerald-600" : "text-zinc-600")}>
                    {s.deltaFromBaseline !== null ? (s.deltaFromBaseline > 0 ? `+${s.deltaFromBaseline}` : s.deltaFromBaseline) : "—"}
                  </td>
                </tr>
              ))}
              {report.symptomStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-zinc-400">
                    No symptom data recorded in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="break-inside-avoid">
          <CardHeader>
            <CardTitle>Greatest increase from baseline</CardTitle>
          </CardHeader>
          <CardContent>
            <SymptomDeltaList items={report.mostIncreased} />
          </CardContent>
        </Card>
        <Card className="break-inside-avoid">
          <CardHeader>
            <CardTitle>Greatest improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <SymptomDeltaList items={report.mostImproved} />
          </CardContent>
        </Card>
      </div>

      <Card className="break-inside-avoid">
        <CardHeader>
          <CardTitle>High-symptom activity periods</CardTitle>
        </CardHeader>
        <CardContent>
          {report.highSymptomPeriods.length === 0 ? (
            <p className="text-sm text-zinc-500">No elevated periods identified in this range.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {report.highSymptomPeriods.map((p, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700">
                    {format(new Date(p.startDate), "MMM d")}
                    {p.startDate !== p.endDate && ` – ${format(new Date(p.endDate), "MMM d, yyyy")}`}
                  </span>
                  <SignalBadge category={p.category} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {report.medicationAdherence.length > 0 && (
        <Card className="break-inside-avoid">
          <CardHeader>
            <CardTitle>Medication adherence</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1.5 text-sm">
              {report.medicationAdherence.map((m) => (
                <li key={m.medicationName} className="flex justify-between">
                  <span className="text-zinc-700">{m.medicationName}</span>
                  <span className="text-zinc-500">
                    {m.percent !== null ? `${m.takenCount}/${m.totalEntries} (${m.percent}%)` : "No data"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {report.notesTimeline.length > 0 && (
        <Card className="break-inside-avoid">
          <CardHeader>
            <CardTitle>Notes timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {report.notesTimeline.map((n, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium text-zinc-700">{format(new Date(n.date), "MMM d, yyyy")}</span>
                  <span className="ml-2 text-xs uppercase tracking-wide text-zinc-400">{n.source}</span>
                  <p className="text-zinc-600">{n.text}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <footer className="border-t border-zinc-200 pt-4 text-xs text-zinc-400">{APP_SCOPE_DISCLAIMER}</footer>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={"mt-1 text-xl font-semibold " + (highlight ? "text-rose-600" : "text-zinc-900")}>{value}</p>
    </div>
  );
}

function SymptomDeltaList({ items }: { items: { label: string; deltaFromBaseline: number | null }[] }) {
  if (items.length === 0) return <p className="text-sm text-zinc-500">Not enough baseline data yet.</p>;
  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {items.map((s) => (
        <li key={s.label} className="flex justify-between">
          <span className="text-zinc-700">{s.label}</span>
          <span className={s.deltaFromBaseline && s.deltaFromBaseline > 0 ? "text-rose-600" : "text-emerald-600"}>
            {s.deltaFromBaseline !== null && s.deltaFromBaseline > 0 ? `+${s.deltaFromBaseline}` : s.deltaFromBaseline}
          </span>
        </li>
      ))}
    </ul>
  );
}
