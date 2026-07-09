import Link from "next/link";
import { format, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { feelingOption } from "@/lib/types/domain";

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
  const today = format(new Date(), "yyyy-MM-dd");
  const since = format(subDays(new Date(), 13), "yyyy-MM-dd");

  const { data: recentCheckins } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("patient_id", patient.id)
    .gte("entry_date", since)
    .order("entry_date", { ascending: false });

  const todayCheckin = recentCheckins?.find((c) => c.entry_date === today && c.completed_at);
  const lastCheckin = recentCheckins?.find((c) => c.completed_at);

  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const day = format(subDays(new Date(), i), "yyyy-MM-dd");
    const found = recentCheckins?.find((c) => c.entry_date === day && c.completed_at);
    if (i === 0 && !found) continue; // today may not be done yet without breaking the streak
    if (!found) break;
    streak++;
  }

  return (
    <div className="flex flex-col gap-5">
      {patients.length > 1 && (
        <p className="text-sm text-zinc-500">Showing {patient.first_name}. Multiple patients coming soon.</p>
      )}

      <Card className="bg-brand text-white">
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="text-sm text-white/80">
              {todayCheckin ? "Today's check-in is done" : "How is " + patient.first_name + " today?"}
            </p>
            <p className="mt-1 text-lg font-semibold">
              {todayCheckin ? "Nice work! 🎉" : "Takes less than a minute"}
            </p>
          </div>
          {!todayCheckin && (
            <Link href="/patient/checkin">
              <Button size="lg" variant="secondary" className="bg-white text-brand-dark hover:bg-zinc-50">
                Check in
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentCheckins || recentCheckins.filter((c) => c.completed_at).length === 0 ? (
            <p className="text-sm text-zinc-500">No check-ins yet. Your first one only takes a minute!</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {Array.from({ length: 7 }).map((_, i) => {
                const day = subDays(new Date(), 6 - i);
                const dayStr = format(day, "yyyy-MM-dd");
                const checkin = recentCheckins?.find((c) => c.entry_date === dayStr && c.completed_at);
                const option = checkin ? feelingOption(checkin.overall_feeling) : undefined;
                return (
                  <div
                    key={dayStr}
                    className="flex min-w-[3.25rem] flex-col items-center gap-1 rounded-xl bg-zinc-50 px-2 py-2"
                  >
                    <span className="text-[10px] font-medium text-zinc-500">{format(day, "EEE")}</span>
                    <span className="text-xl">{option ? option.emoji : "—"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-zinc-900">{streak} day{streak === 1 ? "" : "s"} 🔥</p>
          <p className="mt-1 text-sm text-zinc-500">
            {lastCheckin
              ? `Last check-in: ${format(new Date(lastCheckin.entry_date), "MMMM d, yyyy")}`
              : "No check-ins yet."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-600">
          <p>
            <span className="font-medium text-zinc-900">{patient.first_name} {patient.last_name}</span>
          </p>
          <p>Date of birth: {format(new Date(patient.date_of_birth), "MMMM d, yyyy")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
