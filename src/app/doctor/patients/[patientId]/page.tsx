import Link from "next/link";
import { notFound } from "next/navigation";
import { format, differenceInYears } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { resolveDateRange } from "@/lib/reports/dateRange";
import { fetchVisitRangeData } from "@/lib/reports/visitRangeData";
import { buildSignalSeries, buildSymptomSeries } from "@/lib/reports/deriveTrends";
import { groupHighSymptomPeriods } from "@/lib/reports/highSymptomPeriods";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SignalBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { DateRangeSelector } from "@/components/doctor/DateRangeSelector";
import { SymptomCalcSettings } from "@/components/doctor/SymptomCalcSettings";
import { CoreWeightPanel } from "@/components/doctor/CoreWeightPanel";
import type { TrendPoint } from "@/components/charts/TrendLineChart";

function trendStats(points: TrendPoint[]) {
  const values = points.map((p) => p.value).filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  const average = Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
  return { average, highest: Math.max(...values), lowest: Math.min(...values) };
}

export default async function PatientDetailPage({
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

  const { data: patientCheck } = await supabase
    .from("patients")
    .select("id, clinic_id")
    .eq("id", patientId)
    .single();
  if (!patientCheck || patientCheck.clinic_id !== profile.clinic_id) notFound();

  const range = await resolveDateRange(supabase, patientId, sp);
  const data = await fetchVisitRangeData(supabase, patientId, range);
  if (!data) notFound();

  const { patient } = data;
  const coreSymptoms = data.symptomDefinitions.filter((d) => d.is_core);
  const settingBySymptomId = new Map(data.symptomSettings.map((s) => [s.symptom_definition_id, s]));

  const signalSeries = buildSignalSeries(data);
  const signalStats = trendStats(signalSeries);
  const highSymptomPeriods = groupHighSymptomPeriods(data.signals.map((s) => ({ signal_date: s.signal_date, category: s.category })));

  const rangeQuery = `preset=${range.preset}&start=${range.start}&end=${range.end}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/doctor" className="text-sm text-zinc-500 hover:text-brand-dark">
            ← All patients
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-sm text-zinc-500">
            {differenceInYears(new Date(), new Date(patient.date_of_birth))} years old · DOB{" "}
            {format(new Date(patient.date_of_birth), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/doctor/patients/${patientId}/report?${rangeQuery}`}>
            <Button>Generate office visit report</Button>
          </Link>
        </div>
      </div>

      <DateRangeSelector currentStart={range.start} currentEnd={range.end} />

      <Card style={{ borderColor: "#a78bfa", borderWidth: "3px" }}>
        <CardHeader>
          <CardTitle>High-symptom activity periods</CardTitle>
        </CardHeader>
        <CardContent>
          {highSymptomPeriods.length === 0 ? (
            <p className="text-sm text-zinc-500">No elevated periods identified in this range.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-400">
                <tr>
                  <th className="py-1.5 pr-4">Date range</th>
                  <th className="py-1.5 pr-4">Pattern</th>
                  <th className="py-1.5">Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {highSymptomPeriods.map((p, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-4 text-zinc-700">
                      {format(new Date(p.startDate), "MMM d")}
                      {p.startDate !== p.endDate ? ` – ${format(new Date(p.endDate), "MMM d, yyyy")}` : `, ${format(new Date(p.startDate), "yyyy")}`}
                    </td>
                    <td className="py-2 pr-4">
                      <SignalBadge category={p.category} />
                    </td>
                    <td className="py-2 text-zinc-600">{p.dayCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sjögren&apos;s Symptom Signal</CardTitle>
          <Link href="/doctor/algorithm" className="text-sm font-medium text-brand-dark hover:underline">
            🧮 Algorithm
          </Link>
        </CardHeader>
        <CardContent>
          <TrendLineChart data={signalSeries} color="#7c3aed" domain={[-5, 5]} averageValue={signalStats?.average} />
          {signalStats && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-zinc-400">Average</p>
                <p className="font-semibold text-zinc-700">{signalStats.average}</p>
              </div>
              <div>
                <p className="text-zinc-400">Highest</p>
                <p className="font-semibold text-zinc-700">{signalStats.highest}</p>
              </div>
              <div>
                <p className="text-zinc-400">Lowest</p>
                <p className="font-semibold text-zinc-700">{signalStats.lowest}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Core symptom trends</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CoreWeightPanel patientId={patientId} symptoms={coreSymptoms} settingBySymptomId={settingBySymptomId} />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {coreSymptoms.map((symptom) => {
              const trendData = buildSymptomSeries(data, symptom.id);
              const stats = trendStats(trendData);
              return (
                <div key={symptom.id}>
                  <p className="mb-1 text-sm font-medium text-zinc-700">{symptom.patient_label}</p>
                  <TrendLineChart
                    data={trendData}
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    height={160}
                    averageValue={stats?.average}
                  />
                  {stats && (
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="text-zinc-400">Average</p>
                        <p className="font-semibold text-zinc-700">{stats.average}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400">Highest</p>
                        <p className="font-semibold text-zinc-700">{stats.highest}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400">Lowest</p>
                        <p className="font-semibold text-zinc-700">{stats.lowest}</p>
                      </div>
                    </div>
                  )}
                  <SymptomCalcSettings patientId={patientId} symptom={symptom} setting={settingBySymptomId.get(symptom.id)} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
