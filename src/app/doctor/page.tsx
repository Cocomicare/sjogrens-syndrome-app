import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { getPatientSummaries } from "@/lib/doctor/patientSummary";
import { Card, CardContent } from "@/components/ui/Card";
import { SignalBadge } from "@/components/ui/Badge";

export default async function DoctorDashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (!profile.clinic_id) {
    return <p className="text-zinc-600">Your account isn&apos;t linked to a clinic yet.</p>;
  }

  const summaries = await getPatientSummaries(supabase, profile.clinic_id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Patients</h1>
        <p className="text-sm text-zinc-500">{summaries.length} active patient{summaries.length === 1 ? "" : "s"}</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Age</th>
                <th className="px-5 py-3">Last check-in</th>
                <th className="px-5 py-3">Signal (30d)</th>
                <th className="px-5 py-3">High-symptom days</th>
                <th className="px-5 py-3">Missed entries</th>
                <th className="px-5 py-3">Last visit</th>
                <th className="px-5 py-3">Next visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {summaries.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3">
                    <Link href={`/doctor/patients/${s.id}`} className="font-medium text-brand-dark hover:underline">
                      {s.firstName} {s.lastName}
                    </Link>
                    {s.hasSafetyFlag && <span className="ml-2 text-rose-600">⚠</span>}
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{s.age}</td>
                  <td className="px-5 py-3 text-zinc-600">
                    {s.lastCheckinDate ? format(new Date(s.lastCheckinDate), "MMM d") : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {s.recentSignalCategory ? <SignalBadge category={s.recentSignalCategory} /> : <span className="text-zinc-400">No data</span>}
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{s.highSymptomDays}</td>
                  <td className="px-5 py-3 text-zinc-600">{s.missedEntries}</td>
                  <td className="px-5 py-3 text-zinc-600">
                    {s.lastAppointmentDate ? format(new Date(s.lastAppointmentDate), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-5 py-3 text-zinc-600">
                    {s.nextAppointmentDate ? format(new Date(s.nextAppointmentDate), "MMM d, yyyy") : "—"}
                  </td>
                </tr>
              ))}
              {summaries.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-zinc-500">
                    No patients yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <CardContent className="pt-5 text-xs text-zinc-500">
          This app does not diagnose flares or disease activity. It organizes patient/family-reported
          information and highlights patterns for physician review.
        </CardContent>
      </Card>
    </div>
  );
}
