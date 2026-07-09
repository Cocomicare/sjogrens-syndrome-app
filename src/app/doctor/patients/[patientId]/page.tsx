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
import { AppointmentForm } from "@/components/doctor/AppointmentForm";
import { FAMILY_OBSERVATION_OPTIONS, SIGNAL_CATEGORY_LABEL } from "@/lib/types/domain";

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
  const latestSignal = data.signals[data.signals.length - 1];
  const coreSymptoms = data.symptomDefinitions.filter((d) => d.is_core);
  const optionalSymptoms = data.symptomDefinitions.filter(
    (d) => d.is_optional && !d.is_safety_flag && data.symptomEntries.some((e) => e.symptom_definition_id === d.id)
  );
  const safetySymptoms = data.symptomDefinitions.filter((d) => d.is_safety_flag);

  const signalSeries = buildSignalSeries(data);
  const highSymptomPeriods = groupHighSymptomPeriods(data.signals.map((s) => ({ signal_date: s.signal_date, category: s.category })));
  const safetyFlagDays = data.signals.filter((s) => s.safety_flags.length > 0);

  const checkinById = new Map(data.checkins.map((c) => [c.id, c]));
  const familyObservationDays = data.familyObservations
    .map((fo) => ({ fo, checkin: checkinById.get(fo.daily_checkin_id) }))
    .filter((x) => x.checkin)
    .filter(
      (x) =>
        x.fo.missed_school ||
        x.fo.reduced_activity ||
        x.fo.poor_sleep ||
        x.fo.appetite_change ||
        x.fo.visible_discomfort ||
        x.fo.medication_missed ||
        x.fo.other_concern ||
        x.fo.notes
    )
    .sort((a, b) => (a.checkin!.entry_date < b.checkin!.entry_date ? 1 : -1));

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
          {latestSignal ? (
            <SignalBadge category={latestSignal.category} />
          ) : (
            <span className="text-sm text-zinc-400">No signal data in range</span>
          )}
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
                <TrendLineChart data={buildSymptomSeries(data, symptom.id)} height={160} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {optionalSymptoms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Optional symptom trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {optionalSymptoms.map((symptom) => (
                <div key={symptom.id}>
                  <p className="mb-1 text-sm font-medium text-zinc-700">{symptom.patient_label}</p>
                  <TrendLineChart data={buildSymptomSeries(data, symptom.id)} height={160} color="#d97706" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      <Card>
        <CardHeader>
          <CardTitle>Family observations & notes timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {familyObservationDays.length === 0 ? (
            <p className="text-sm text-zinc-500">No family observations recorded in this range.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {familyObservationDays.map(({ fo, checkin }) => (
                <li key={fo.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-xs font-medium text-zinc-500">{format(new Date(checkin!.entry_date), "MMM d, yyyy")}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {FAMILY_OBSERVATION_OPTIONS.filter((opt) => fo[opt.key]).map((opt) => (
                      <span key={opt.key} className="rounded-full bg-white px-2 py-0.5 text-xs text-zinc-700 ring-1 ring-zinc-200">
                        {opt.icon} {opt.label}
                      </span>
                    ))}
                  </div>
                  {fo.notes && <p className="mt-1.5 text-sm text-zinc-600">&ldquo;{fo.notes}&rdquo;</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <AppointmentForm patientId={patientId} />
          {data.appointments.length > 0 && (
            <ul className="divide-y divide-zinc-100 text-sm">
              {data.appointments.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <span className="text-zinc-700">
                    {format(new Date(a.appointment_date), "MMM d, yyyy")}
                    {a.appointment_type && <span className="ml-2 text-zinc-400">{a.appointment_type}</span>}
                  </span>
                  {a.notes && <span className="text-zinc-500">{a.notes}</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {safetySymptoms.length > 0 && (
        <p className="text-xs text-zinc-400">
          Tracked safety-flag symptoms: {safetySymptoms.map((s) => s.patient_label).join(", ")}. Category legend:{" "}
          {Object.values(SIGNAL_CATEGORY_LABEL).join(", ")}.
        </p>
      )}
    </div>
  );
}
