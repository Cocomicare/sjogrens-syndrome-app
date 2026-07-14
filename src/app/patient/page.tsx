import Link from "next/link";
import { format, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TrendLineChart } from "@/components/charts/TrendLineChart";

const TREND_DAYS = 30;

export default async function PatientDashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: patients } = await supabase
    .from("patients")
    .select("*")
    .eq("patient_family_profile_id", profile.id)
    .eq("active_status", true);

  if (!patients || patients.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-zinc-600">
          No patient is linked to your account yet. Please contact your clinic.
        </CardContent>
      </Card>
    );
  }

  const patient = patients[0];
  const since = format(subDays(new Date(), TREND_DAYS - 1), "yyyy-MM-dd");

  const { data: recentCheckins } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("patient_id", patient.id)
    .gte("entry_date", since)
    .order("entry_date", { ascending: false })
    .order("completed_at", { ascending: false });

  const trendData = Array.from({ length: TREND_DAYS }).map((_, i) => {
    const day = subDays(new Date(), TREND_DAYS - 1 - i);
    const dayStr = format(day, "yyyy-MM-dd");
    const checkin = recentCheckins?.find((c) => c.entry_date === dayStr && c.completed_at);
    return { date: dayStr, value: checkin ? checkin.overall_feeling : null };
  });
  const hasAnyCheckin = trendData.some((d) => d.value !== null);

  return (
    <div className="flex flex-col gap-5">
      {patients.length > 1 && (
        <p className="text-sm text-zinc-500">Showing {patient.first_name}. Multiple patients coming soon.</p>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-lg">
        <span className="pointer-events-none absolute -right-6 -top-8 text-[9rem] leading-none opacity-15">
          💧
        </span>
        <span className="pointer-events-none absolute -bottom-10 -left-4 text-[7rem] leading-none opacity-10">
          💧
        </span>
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-white/70">
              {patient.first_name}&apos;s daily check-in
            </p>
            <p className="mt-2 text-2xl font-bold">How are you feeling today?</p>
            <p className="mt-1 text-sm text-white/80">Takes less than a minute</p>
          </div>
          <Link href="/patient/checkin" className="shrink-0">
            <Button size="lg" variant="secondary" className="bg-white text-brand-dark shadow-md hover:bg-zinc-50">
              Check in
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your trend</CardTitle>
          <Link href="/patient/history" className="text-sm font-medium text-brand-dark hover:underline">
            View full history →
          </Link>
        </CardHeader>
        <CardContent>
          {!hasAnyCheckin ? (
            <p className="text-sm text-zinc-500">No check-ins yet. Your first one only takes a minute!</p>
          ) : (
            <>
              <TrendLineChart data={trendData} domain={[0, 4]} height={180} />
              <p className="mt-2 text-xs text-zinc-400">Last {TREND_DAYS} days · 0 = Very bad · 4 = Great</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
