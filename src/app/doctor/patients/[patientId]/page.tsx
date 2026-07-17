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

export default async function PatientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ preset?: string; start?: string; end?: string; settings?: string }>;
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
  const highSymptomPeriods = groupHighSymptomPeriods(data.signals.map((s) => ({ signal_date: s.signal_date, category: s.category })));
  const safetyFlagDays = data.signals.filter((s) => s.safety_flags.length > 0);

  const rangeQuery = `preset=${range.preset}&start=${range.start}&end=${range.end}`;
  const showSettings = sp.settings === "1";
  const settingsToggleQuery = showSettings ? rangeQuery : `${rangeQuery}&settings=1`;

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
          <Link href={`?${settingsToggleQuery}`}>
            <Button variant="secondary">{showSettings ? "Hide score settings" : "⚙ Score settings"}</Button>
          </Link>
          <Link href={`/doctor/patients/${patientId}/report?${rangeQuery}`}>
            <Button>Generate office visit report</Button>
          </Link>
        </div>
      </div>

      {safetyFlagDays.length > 0 && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="pt-5 text-sm text-rose-800">
            <p className="font-semibold">⚠ Safety flags reported in this range</p>
            <ul className="mt-2 list-inside list-disc">
              {safetyFlagDays.map((s) => (
                <li key={s.id}>
                  {format(new Date(s.signal_date), "MMM d, yyyy")}: {s.safety_flags.join(", ")}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <DateRangeSelector currentStart={range.start} currentEnd={range.end} />

      <Card>
        <CardHeader>
          <CardTitle>Sjögren&apos;s Symptom Signal</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendLineChart data={signalSeries} color="#7c3aed" domain={[-5, 5]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Core symptom trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {coreSymptoms.map((symptom) => (
              <div key={symptom.id}>
                <p className="mb-1 text-sm font-medium text-zinc-700">{symptom.patient_label}</p>
                <TrendLineChart data={buildSymptomSeries(data, symptom.id)} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} height={160} />
                {showSettings && (
                  <SymptomCalcSettings patientId={patientId} symptom={symptom} setting={settingBySymptomId.get(symptom.id)} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
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
    </div>
  );
}
